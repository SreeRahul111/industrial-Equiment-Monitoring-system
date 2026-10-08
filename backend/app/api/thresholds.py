from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.machine import Machine
from backend.app.models.threshold import Threshold, ThresholdHistory
from backend.app.models.user import User
from backend.app.schemas.threshold import ThresholdOut, ThresholdUpdate, ThresholdHistoryOut
from backend.app.security.dependencies import get_current_user, require_engineer_or_admin
from backend.app.audit.audit_logger import log_audit_event

router = APIRouter(prefix="/thresholds", tags=["Thresholds"])

@router.get("/{machine_id}", response_model=ThresholdOut)
def get_threshold(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    threshold = db.query(Threshold).filter(Threshold.machine_id == machine_id).first()
    if not threshold:
        # Check machine exists
        machine = db.query(Machine).filter(Machine.id == machine_id).first()
        if not machine:
            raise HTTPException(status_code=404, detail="Machine not found")
        # Create default
        threshold = Threshold(
            machine_id=machine_id,
            temperature_min=10.0,
            temperature_max=90.0,
            pressure_min=1.0,
            pressure_max=8.0,
            vibration_max=6.0,
            power_min=5.0,
            power_max=80.0,
            version=1,
            created_by="system"
        )
        db.add(threshold)
        db.commit()
        db.refresh(threshold)
    return ThresholdOut.model_validate(threshold)

@router.put("/{machine_id}", response_model=ThresholdOut)
def update_threshold(
    machine_id: int,
    body: ThresholdUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_engineer_or_admin)
):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    # Range and cross-field logic validation
    if body.temperature_min >= body.temperature_max:
        raise HTTPException(status_code=422, detail="Temperature min must be strictly less than temperature max")
    if body.pressure_min >= body.pressure_max:
        raise HTTPException(status_code=422, detail="Pressure min must be strictly less than pressure max")
    if body.power_min >= body.power_max:
        raise HTTPException(status_code=422, detail="Power min must be strictly less than power max")

    threshold = db.query(Threshold).filter(Threshold.machine_id == machine_id).first()
    if not threshold:
        threshold = Threshold(machine_id=machine_id, version=0)
        db.add(threshold)

    # Archive previous state to ThresholdHistory
    history_entry = ThresholdHistory(
        threshold_id=threshold.id,
        machine_id=machine_id,
        version=threshold.version or 1,
        temperature_min=threshold.temperature_min,
        temperature_max=threshold.temperature_max,
        pressure_min=threshold.pressure_min,
        pressure_max=threshold.pressure_max,
        vibration_max=threshold.vibration_max,
        power_min=threshold.power_min,
        power_max=threshold.power_max,
        changed_by=current_user.name,
        change_reason=body.reason or "Authorized calibration update",
        created_at=datetime.utcnow()
    )
    db.add(history_entry)

    old_values = {
        "temperature_max": threshold.temperature_max,
        "pressure_max": threshold.pressure_max,
        "vibration_max": threshold.vibration_max,
        "power_max": threshold.power_max,
        "version": threshold.version
    }

    # Apply updates and bump version
    threshold.temperature_min = body.temperature_min
    threshold.temperature_max = body.temperature_max
    threshold.pressure_min = body.pressure_min
    threshold.pressure_max = body.pressure_max
    threshold.vibration_max = body.vibration_max
    threshold.power_min = body.power_min
    threshold.power_max = body.power_max
    threshold.version = (threshold.version or 0) + 1
    threshold.created_by = current_user.email
    threshold.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(threshold)

    log_audit_event(
        db=db,
        action="THRESHOLD_MODIFICATION",
        target_type="THRESHOLD",
        target_id=str(machine_id),
        actor_user_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        result="ALLOWED",
        metadata={
            "machine_code": machine.machine_code,
            "version": threshold.version,
            "old_values": old_values,
            "new_values": {
                "temperature_max": threshold.temperature_max,
                "pressure_max": threshold.pressure_max,
                "vibration_max": threshold.vibration_max,
                "power_max": threshold.power_max
            },
            "reason": body.reason
        }
    )

    return ThresholdOut.model_validate(threshold)

@router.get("/{machine_id}/history", response_model=List[ThresholdHistoryOut])
def get_threshold_history(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    history = (
        db.query(ThresholdHistory)
        .filter(ThresholdHistory.machine_id == machine_id)
        .order_by(ThresholdHistory.version.desc())
        .all()
    )
    return [ThresholdHistoryOut.model_validate(h) for h in history]
