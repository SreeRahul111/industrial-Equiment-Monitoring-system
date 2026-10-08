from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.audit import AuditEvent
from backend.app.models.user import User
from backend.app.schemas.audit import AuditEventOut
from backend.app.security.dependencies import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit & Security"])

@router.get("", response_model=List[AuditEventOut])
def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action name"),
    result: Optional[str] = Query(None, description="Filter by result (ALLOWED, DENIED)"),
    target_type: Optional[str] = Query(None, description="Filter by target type"),
    search: Optional[str] = Query(None, description="Search actor or target"),
    limit: int = Query(100, ge=1, le=500, description="Max audit logs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditEvent)
    if action:
        query = query.filter(AuditEvent.action == action)
    if result:
        query = query.filter(AuditEvent.result == result)
    if target_type:
        query = query.filter(AuditEvent.target_type == target_type)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (AuditEvent.actor_name.ilike(s)) |
            (AuditEvent.target_id.ilike(s)) |
            (AuditEvent.action.ilike(s))
        )

    records = query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    return [AuditEventOut.model_validate(r) for r in records]
