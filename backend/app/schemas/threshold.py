from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ThresholdUpdate(BaseModel):
    temperature_min: float = Field(..., ge=-40.0, le=150.0)
    temperature_max: float = Field(..., ge=-20.0, le=200.0)
    pressure_min: float = Field(..., ge=0.0, le=50.0)
    pressure_max: float = Field(..., ge=0.1, le=100.0)
    vibration_max: float = Field(..., ge=0.1, le=50.0)
    power_min: float = Field(..., ge=0.0, le=500.0)
    power_max: float = Field(..., ge=1.0, le=1000.0)
    reason: Optional[str] = "Standard calibration"

class ThresholdOut(BaseModel):
    id: int
    machine_id: int
    temperature_min: float
    temperature_max: float
    pressure_min: float
    pressure_max: float
    vibration_max: float
    power_min: float
    power_max: float
    version: int
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ThresholdHistoryOut(BaseModel):
    id: int
    threshold_id: int
    machine_id: int
    version: int
    temperature_min: float
    temperature_max: float
    pressure_min: float
    pressure_max: float
    vibration_max: float
    power_min: float
    power_max: float
    changed_by: str
    change_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
