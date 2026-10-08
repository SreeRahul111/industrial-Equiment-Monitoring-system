from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AuditEventOut(BaseModel):
    id: int
    actor_user_id: Optional[int] = None
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[str] = None
    result: str
    metadata_json: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
