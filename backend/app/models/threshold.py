from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Threshold(Base):
    __tablename__ = "thresholds"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    temperature_min = Column(Float, nullable=False, default=10.0)
    temperature_max = Column(Float, nullable=False, default=90.0)
    pressure_min = Column(Float, nullable=False, default=1.0)
    pressure_max = Column(Float, nullable=False, default=8.0)
    vibration_max = Column(Float, nullable=False, default=6.0)
    power_min = Column(Float, nullable=False, default=5.0)
    power_max = Column(Float, nullable=False, default=80.0)
    version = Column(Integer, default=1, nullable=False)
    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    machine = relationship("Machine", back_populates="threshold")
    history = relationship("ThresholdHistory", back_populates="threshold", cascade="all, delete-orphan", order_by="desc(ThresholdHistory.version)")

class ThresholdHistory(Base):
    __tablename__ = "threshold_history"

    id = Column(Integer, primary_key=True, index=True)
    threshold_id = Column(Integer, ForeignKey("thresholds.id", ondelete="CASCADE"), nullable=False, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    temperature_min = Column(Float, nullable=False)
    temperature_max = Column(Float, nullable=False)
    pressure_min = Column(Float, nullable=False)
    pressure_max = Column(Float, nullable=False)
    vibration_max = Column(Float, nullable=False)
    power_min = Column(Float, nullable=False)
    power_max = Column(Float, nullable=False)
    changed_by = Column(String(255), nullable=False)
    change_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    threshold = relationship("Threshold", back_populates="history")
