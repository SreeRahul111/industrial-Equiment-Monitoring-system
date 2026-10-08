import json
from datetime import datetime
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from backend.app.models.audit import AuditEvent

def log_audit_event(
    db: Session,
    action: str,
    target_type: str,
    target_id: Optional[str] = None,
    actor_user_id: Optional[int] = None,
    actor_name: Optional[str] = None,
    actor_role: Optional[str] = None,
    result: str = "ALLOWED",
    metadata: Optional[Dict[str, Any]] = None
) -> AuditEvent:
    event = AuditEvent(
        actor_user_id=actor_user_id,
        actor_name=actor_name or "System",
        actor_role=actor_role or "SYSTEM",
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id is not None else None,
        result=result,
        metadata_json=json.dumps(metadata) if metadata else None,
        timestamp=datetime.utcnow()
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
