from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from backend.app.models.maintenance import MaintenanceStatus

class MaintenanceCreate(BaseModel):
    machine_id: int
    scheduled_date: datetime
    maintenance_type: str
    assigned_engineer: str
    notes: Optional[str] = None

class MaintenanceUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    maintenance_type: Optional[str] = None
    assigned_engineer: Optional[str] = None
    status: Optional[MaintenanceStatus] = None
    notes: Optional[str] = None

class MaintenanceOut(BaseModel):
    id: int
    machine_id: int
    machine_code: Optional[str] = None
    machine_name: Optional[str] = None
    scheduled_date: datetime
    maintenance_type: str
    assigned_engineer: str
    status: MaintenanceStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
