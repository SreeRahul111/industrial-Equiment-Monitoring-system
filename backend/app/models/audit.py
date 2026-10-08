from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from backend.app.database import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, nullable=True, index=True)
    actor_name = Column(String(255), nullable=True)
    actor_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    target_type = Column(String(100), nullable=False, index=True)
    target_id = Column(String(100), nullable=True)
    result = Column(String(50), nullable=False, index=True)  # ALLOWED, DENIED, SUCCESS, FAILED
    metadata_json = Column(Text, nullable=True)               # IP, User-Agent, changed diffs
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
