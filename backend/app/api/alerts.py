from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.alert import Alert, AlertSeverity, AlertStatus
from backend.app.models.machine import Machine, MachineStatus
from backend.app.models.user import User
from backend.app.schemas.alert import AlertOut, AlertAcknowledgeRequest, AlertResolveRequest
from backend.app.security.dependencies import get_current_user, require_engineer_or_admin
from backend.app.audit.audit_logger import log_audit_event

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut])
def list_alerts(
    severity: Optional[AlertSeverity] = Query(None, description="Filter by severity"),
    status: Optional[AlertStatus] = Query(None, description="Filter by status"),
    machine_id: Optional[int] = Query(None, description="Filter by machine ID"),
    search: Optional[str] = Query(None, description="Search alert code or message"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Alert).join(Machine, Alert.machine_id == Machine.id)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status:
        query = query.filter(Alert.status == status)
    if machine_id:
        query = query.filter(Alert.machine_id == machine_id)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Alert.message.ilike(s)) |
            (Alert.alert_code.ilike(s)) |
            (Machine.name.ilike(s)) |
            (Machine.machine_code.ilike(s))
        )
    
    alerts = query.order_by(Alert.created_at.desc()).all()
    results = []
    for a in alerts:
        ao = AlertOut.model_validate(a)
        ao.machine_code = a.machine.machine_code if a.machine else None
        ao.machine_name = a.machine.name if a.machine else None
        results.append(ao)
    return results

@router.get("/{alert_id}", response_model=AlertOut)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    ao = AlertOut.model_validate(alert)
    ao.machine_code = alert.machine.machine_code if alert.machine else None
    ao.machine_name = alert.machine.name if alert.machine else None
    return ao

@router.post("/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge_alert(
    alert_id: int,
    body: AlertAcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_engineer_or_admin)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if alert.status == AlertStatus.RESOLVED:
        raise HTTPException(status_code=400, detail="Cannot acknowledge an already resolved alert")

    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_at = datetime.utcnow()
    alert.acknowledged_by = current_user.name
    db.commit()
    db.refresh(alert)

    log_audit_event(
        db=db,
        action="ALERT_ACKNOWLEDGED",
        target_type="ALERT",
        target_id=str(alert.id),
        actor_user_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        result="ALLOWED",
        metadata={
            "alert_code": alert.alert_code,
            "machine_id": alert.machine_id,
            "note": body.note
        }
    )

    ao = AlertOut.model_validate(alert)
    ao.machine_code = alert.machine.machine_code if alert.machine else None
    ao.machine_name = alert.machine.name if alert.machine else None
    return ao

@router.post("/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(
    alert_id: int,
    body: AlertResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_engineer_or_admin)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by = current_user.name
    db.commit()

    # Re-evaluate machine status
    remaining_critical = db.query(Alert).filter(
        Alert.machine_id == alert.machine_id,
        Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
        Alert.severity == AlertSeverity.CRITICAL
    ).first()

    remaining_warning = db.query(Alert).filter(
        Alert.machine_id == alert.machine_id,
        Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
        Alert.severity == AlertSeverity.WARNING
    ).first()

    machine = db.query(Machine).filter(Machine.id == alert.machine_id).first()
    if machine:
        if remaining_critical:
            machine.status = MachineStatus.CRITICAL
        elif remaining_warning:
            machine.status = MachineStatus.WARNING
        else:
            machine.status = MachineStatus.NORMAL
        db.commit()

    db.refresh(alert)

    log_audit_event(
        db=db,
        action="ALERT_RESOLVED",
        target_type="ALERT",
        target_id=str(alert.id),
        actor_user_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        result="ALLOWED",
        metadata={
            "alert_code": alert.alert_code,
            "machine_id": alert.machine_id,
            "resolution_note": body.resolution_note
        }
    )

    ao = AlertOut.model_validate(alert)
    ao.machine_code = alert.machine.machine_code if alert.machine else None
    ao.machine_name = alert.machine.name if alert.machine else None
    return ao
