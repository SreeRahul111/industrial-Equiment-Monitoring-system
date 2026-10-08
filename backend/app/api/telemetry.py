from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.machine import Machine
from backend.app.models.telemetry import Telemetry
from backend.app.models.sensor import Sensor
from backend.app.models.user import User
from backend.app.schemas.telemetry import TelemetryIngest, TelemetryOut
from backend.app.telemetry.validator import validate_telemetry_payload
from backend.app.alerts.engine import evaluate_telemetry_and_generate_alerts
from backend.app.security.dependencies import get_current_user
from backend.app.audit.audit_logger import log_audit_event

router = APIRouter(tags=["Telemetry"])

@router.get("/machines/{machine_id}/telemetry", response_model=List[TelemetryOut])
def get_machine_telemetry(
    machine_id: int,
    hours: int = Query(24, ge=1, le=720, description="Hours of telemetry history"),
    limit: int = Query(100, ge=1, le=500, description="Max telemetry records"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    since_time = datetime.utcnow() - timedelta(hours=hours)
    records = (
        db.query(Telemetry)
        .filter(Telemetry.machine_id == machine_id, Telemetry.timestamp >= since_time)
        .order_by(Telemetry.timestamp.desc())
        .limit(limit)
        .all()
    )
    records.reverse()  # Chronological order
    return [TelemetryOut.model_validate(r) for r in records]

@router.post("/telemetry", response_model=TelemetryOut, status_code=status.HTTP_201_CREATED)
def ingest_telemetry(
    request: Request,
    body: TelemetryIngest,
    db: Session = Depends(get_db)
):
    # Verify machine exists
    machine = db.query(Machine).filter(Machine.id == body.machine_id).first()
    if not machine:
        log_audit_event(
            db=db,
            action="TELEMETRY_REJECTED_UNKNOWN_MACHINE",
            target_type="TELEMETRY",
            target_id=str(body.machine_id),
            actor_name="Sensor Ingestion",
            actor_role="SYSTEM",
            result="DENIED",
            metadata={"reason": "Machine ID does not exist"}
        )
        raise HTTPException(status_code=404, detail=f"Machine ID {body.machine_id} not found")

    # Verify sensor if provided
    if body.sensor_id is not None:
        sensor = db.query(Sensor).filter(Sensor.id == body.sensor_id, Sensor.machine_id == machine.id).first()
        if not sensor:
            raise HTTPException(status_code=400, detail=f"Sensor ID {body.sensor_id} is not associated with this machine")

    # Validate physical plausibility
    is_valid, validation_error = validate_telemetry_payload(body.model_dump())
    if not is_valid:
        log_audit_event(
            db=db,
            action="TELEMETRY_VALIDATION_FAILURE",
            target_type="TELEMETRY",
            target_id=str(body.machine_id),
            actor_name="Telemetry Ingestion Gateway",
            actor_role="SYSTEM",
            result="DENIED",
            metadata={"payload": body.model_dump(mode="json"), "error": validation_error}
        )
        raise HTTPException(status_code=422, detail=f"Telemetry validation rejected: {validation_error}")

    telemetry = Telemetry(
        machine_id=body.machine_id,
        sensor_id=body.sensor_id,
        temperature=body.temperature,
        pressure=body.pressure,
        vibration=body.vibration,
        power_consumption=body.power_consumption,
        operating_status=body.operating_status,
        timestamp=body.timestamp or datetime.utcnow(),
        validation_status="VALID"
    )
    db.add(telemetry)
    db.commit()
    db.refresh(telemetry)

    # Trigger abnormal behavior detection engine
    evaluate_telemetry_and_generate_alerts(db, machine, telemetry)

    return TelemetryOut.model_validate(telemetry)
