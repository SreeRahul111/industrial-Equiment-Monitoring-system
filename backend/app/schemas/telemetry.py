from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TelemetryIngest(BaseModel):
    machine_id: int
    sensor_id: Optional[int] = None
    temperature: float = Field(..., ge=-40.0, le=200.0)
    pressure: float = Field(..., ge=0.0, le=100.0)
    vibration: float = Field(..., ge=0.0, le=50.0)
    power_consumption: float = Field(..., ge=0.0, le=1000.0)
    operating_status: str = Field(..., pattern="^(RUNNING|IDLE|STANDBY|STOPPED)$")
    timestamp: Optional[datetime] = None

class TelemetryOut(BaseModel):
    id: int
    machine_id: int
    sensor_id: Optional[int] = None
    temperature: float
    pressure: float
    vibration: float
    power_consumption: float
    operating_status: str
    timestamp: datetime
    validation_status: str

    class Config:
        from_attributes = True
