import enum
from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from backend.app.database import Base

class AlertSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"

class AlertStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_code = Column(String(50), nullable=True, index=True)  # ALT-1042
    alert_type = Column(String(100), nullable=False)            # Vibration, Temperature, Pressure, Power
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.WARNING, nullable=False, index=True)
    measured_value = Column(Float, nullable=False)
    threshold_value = Column(Float, nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.ACTIVE, nullable=False, index=True)
    message = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(255), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(255), nullable=True)

    machine = relationship("Machine", back_populates="alerts")
