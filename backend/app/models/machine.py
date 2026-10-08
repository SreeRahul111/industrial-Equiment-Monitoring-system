import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from backend.app.database import Base

class MachineStatus(str, enum.Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    OFFLINE = "OFFLINE"

class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    machine_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    status = Column(Enum(MachineStatus), default=MachineStatus.NORMAL, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sensors = relationship("Sensor", back_populates="machine", cascade="all, delete-orphan")
    telemetry_records = relationship("Telemetry", back_populates="machine", cascade="all, delete-orphan")
    threshold = relationship("Threshold", back_populates="machine", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="machine", cascade="all, delete-orphan")
    maintenance_records = relationship("Maintenance", back_populates="machine", cascade="all, delete-orphan")
