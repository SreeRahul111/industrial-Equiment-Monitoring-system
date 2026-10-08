from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from backend.app.models.alert import AlertSeverity, AlertStatus

class AlertOut(BaseModel):
    id: int
    machine_id: int
    machine_code: Optional[str] = None
    machine_name: Optional[str] = None
    alert_code: Optional[str] = None
    alert_type: str
    severity: AlertSeverity
    measured_value: float
    threshold_value: float
    status: AlertStatus
    message: str
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    note: Optional[str] = "Acknowledged by authorized engineer"

class AlertResolveRequest(BaseModel):
    resolution_note: Optional[str] = "Abnormal condition resolved and verified"
