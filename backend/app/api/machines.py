from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.machine import Machine, MachineStatus
from backend.app.models.telemetry import Telemetry
from backend.app.models.threshold import Threshold
from backend.app.models.alert import Alert, AlertStatus
from backend.app.models.sensor import Sensor
from backend.app.models.user import User
from backend.app.schemas.machine import MachineOut, MachineDetailOut, MachineCreate, MachineUpdate
from backend.app.schemas.telemetry import TelemetryOut
from backend.app.schemas.threshold import ThresholdOut
from backend.app.schemas.alert import AlertOut
from backend.app.security.dependencies import get_current_user, require_engineer_or_admin
from backend.app.audit.audit_logger import log_audit_event

router = APIRouter(prefix="/machines", tags=["Machines"])

@router.get("", response_model=List[MachineOut])
def list_machines(
    search: Optional[str] = Query(None, description="Search machine name or code"),
    status: Optional[MachineStatus] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Machine)
    if status:
        query = query.filter(Machine.status == status)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Machine.name.ilike(s)) | (Machine.machine_code.ilike(s)))
    
    machines = query.order_by(Machine.machine_code.asc()).all()
    results = []

    for m in machines:
        latest_telemetry = (
            db.query(Telemetry)
            .filter(Telemetry.machine_id == m.id)
            .order_by(Telemetry.timestamp.desc())
            .first()
        )
        active_alerts_cnt = (
            db.query(Alert)
            .filter(Alert.machine_id == m.id, Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]))
            .count()
        )
        m_out = MachineOut(
            id=m.id,
            machine_code=m.machine_code,
            name=m.name,
            location=m.location,
            status=m.status,
            created_at=m.created_at,
            updated_at=m.updated_at,
            latest_telemetry=TelemetryOut.model_validate(latest_telemetry) if latest_telemetry else None,
            active_alerts_count=active_alerts_cnt
        )
        results.append(m_out)

    return results

@router.get("/{machine_id}", response_model=MachineDetailOut)
def get_machine_detail(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    latest_telemetry = (
        db.query(Telemetry)
        .filter(Telemetry.machine_id == machine.id)
        .order_by(Telemetry.timestamp.desc())
        .first()
    )

    recent_telemetry = (
        db.query(Telemetry)
        .filter(Telemetry.machine_id == machine.id)
        .order_by(Telemetry.timestamp.desc())
        .limit(50)
        .all()
    )
    # Return chronologically ascending for charts
    recent_telemetry.reverse()

    active_alerts = (
        db.query(Alert)
        .filter(Alert.machine_id == machine.id, Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]))
        .order_by(Alert.created_at.desc())
        .all()
    )

    threshold = db.query(Threshold).filter(Threshold.machine_id == machine.id).first()
    sensors = db.query(Sensor).filter(Sensor.machine_id == machine.id).all()

    alert_outs = []
    for a in active_alerts:
        ao = AlertOut.model_validate(a)
        ao.machine_code = machine.machine_code
        ao.machine_name = machine.name
        alert_outs.append(ao)

    return MachineDetailOut(
        id=machine.id,
        machine_code=machine.machine_code,
        name=machine.name,
        location=machine.location,
        status=machine.status,
        created_at=machine.created_at,
        updated_at=machine.updated_at,
        latest_telemetry=TelemetryOut.model_validate(latest_telemetry) if latest_telemetry else None,
        active_alerts_count=len(active_alerts),
        sensors=sensors,
        threshold=ThresholdOut.model_validate(threshold) if threshold else None,
        recent_telemetry=[TelemetryOut.model_validate(t) for t in recent_telemetry],
        active_alerts=alert_outs
    )

@router.post("", response_model=MachineOut, status_code=status.HTTP_201_CREATED)
def create_machine(
    request: Request,
    body: MachineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_engineer_or_admin)
):
    existing = db.query(Machine).filter(Machine.machine_code == body.machine_code.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Machine code {body.machine_code} already registered")

    machine = Machine(
        machine_code=body.machine_code.strip().upper(),
        name=body.name.strip(),
        location=body.location.strip(),
        status=MachineStatus.NORMAL
    )
    db.add(machine)
    db.commit()
    db.refresh(machine)

    # Automatically initialize default thresholds
    threshold = Threshold(
        machine_id=machine.id,
        temperature_min=10.0,
        temperature_max=90.0,
        pressure_min=1.0,
        pressure_max=8.0,
        vibration_max=6.0,
        power_min=5.0,
        power_max=80.0,
        version=1,
        created_by=current_user.email
    )
    db.add(threshold)
    db.commit()

    log_audit_event(
        db=db,
        action="MACHINE_CREATE",
        target_type="MACHINE",
        target_id=str(machine.id),
        actor_user_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        result="ALLOWED",
        metadata={"machine_code": machine.machine_code, "name": machine.name}
    )

    return MachineOut(
        id=machine.id,
        machine_code=machine.machine_code,
        name=machine.name,
        location=machine.location,
        status=machine.status,
        created_at=machine.created_at,
        updated_at=machine.updated_at,
        latest_telemetry=None,
        active_alerts_count=0
    )

@router.put("/{machine_id}", response_model=MachineOut)
def update_machine(
    machine_id: int,
    body: MachineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_engineer_or_admin)
):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    if body.name is not None:
        machine.name = body.name.strip()
    if body.location is not None:
        machine.location = body.location.strip()
    if body.status is not None:
        machine.status = body.status
    machine.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(machine)

    log_audit_event(
        db=db,
        action="MACHINE_UPDATE",
        target_type="MACHINE",
        target_id=str(machine.id),
        actor_user_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        result="ALLOWED",
        metadata={"machine_code": machine.machine_code}
    )

    return MachineOut(
        id=machine.id,
        machine_code=machine.machine_code,
        name=machine.name,
        location=machine.location,
        status=machine.status,
        created_at=machine.created_at,
        updated_at=machine.updated_at
    )
