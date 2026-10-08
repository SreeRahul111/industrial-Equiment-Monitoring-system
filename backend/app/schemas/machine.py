from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from backend.app.models.machine import MachineStatus
from backend.app.schemas.telemetry import TelemetryOut
from backend.app.schemas.threshold import ThresholdOut
from backend.app.schemas.alert import AlertOut

class MachineBase(BaseModel):
    machine_code: str
    name: str
    location: str

class MachineCreate(MachineBase):
    pass

class MachineUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    status: Optional[MachineStatus] = None

class SensorOut(BaseModel):
    id: int
    sensor_type: str
    sensor_code: str
    unit: str
    status: str

    class Config:
        from_attributes = True

class MachineOut(MachineBase):
    id: int
    status: MachineStatus
    created_at: datetime
    updated_at: datetime
    latest_telemetry: Optional[TelemetryOut] = None
    active_alerts_count: int = 0

    class Config:
        from_attributes = True

class MachineDetailOut(MachineOut):
    sensors: List[SensorOut] = []
    threshold: Optional[ThresholdOut] = None
    recent_telemetry: List[TelemetryOut] = []
    active_alerts: List[AlertOut] = []
