from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.maintenance import Maintenance, MaintenanceStatus
from backend.app.models.machine import Machine
from backend.app.models.user import User
from backend.app.schemas.maintenance import MaintenanceOut, MaintenanceCreate, MaintenanceUpdate
from backend.app.security.dependencies import get_current_user, require_engineer_or_admin
from backend.app.audit.audit_logger import log_audit_event

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

@router.get("", response_model=List[MaintenanceOut])
def list_maintenance(
    status: Optional[MaintenanceStatus] = Query(None, description="Filter by maintenance status"),
    machine_id: Optional[int] = Query(None, description="Filter by machine ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Maintenance).join(Machine, Maintenance.machine_id == Machine.id)
    if status:
        query = query.filter(Maintenance.status == status)
    if machine_id:
        query = query.filter(Maintenance.machine_id == machine_id)
    
    records = query.order_by(Maintenance.scheduled_date.asc()).all()
    results = []
    for r in records:
        mo = MaintenanceOut.model_validate(r)
        mo.machine_code = r.machine.machine_code if r.machine else None
        mo.machine_name = r.machine.name if r.machine else None
        results.append(mo)
    return results

@router.post("", response_model=MaintenanceOut, status_code=201)
def schedule_maintenance(
    body: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_engineer_or_admin)
):
    machine = db.query(Machine).filter(Machine.id == body.machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    item = Maintenance(
        machine_id=body.machine_id,
        scheduled_date=body.scheduled_date,
        maintenance_type=body.maintenance_type.strip(),
        assigned_engineer=body.assigned_engineer.strip(),
        status=MaintenanceStatus.SCHEDULED,
        notes=body.notes
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    log_audit_event(
        db=db,
        action="MAINTENANCE_SCHEDULED",
        target_type="MAINTENANCE",
        target_id=str(item.id),
        actor_user_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        result="ALLOWED",
        metadata={
            "machine_code": machine.machine_code,
            "type": item.maintenance_type,
            "scheduled_date": item.scheduled_date.isoformat(),
            "assigned_engineer": item.assigned_engineer
        }
    )

    mo = MaintenanceOut.model_validate(item)
    mo.machine_code = machine.machine_code
    mo.machine_name = machine.name
    return mo

@router.put("/{maintenance_id}", response_model=MaintenanceOut)
def update_maintenance(
    maintenance_id: int,
    body: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_engineer_or_admin)
):
    item = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Maintenance schedule not found")

    if body.scheduled_date is not None:
        item.scheduled_date = body.scheduled_date
    if body.maintenance_type is not None:
        item.maintenance_type = body.maintenance_type.strip()
    if body.assigned_engineer is not None:
        item.assigned_engineer = body.assigned_engineer.strip()
    if body.status is not None:
        item.status = body.status
    if body.notes is not None:
        item.notes = body.notes
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)

    log_audit_event(
        db=db,
        action="MAINTENANCE_UPDATED",
        target_type="MAINTENANCE",
        target_id=str(item.id),
        actor_user_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        result="ALLOWED",
        metadata={
            "status": item.status.value,
            "machine_id": item.machine_id
        }
    )

    mo = MaintenanceOut.model_validate(item)
    mo.machine_code = item.machine.machine_code if item.machine else None
    mo.machine_name = item.machine.name if item.machine else None
    return mo
