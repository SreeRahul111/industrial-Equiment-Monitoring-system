from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id", ondelete="SET NULL"), nullable=True)
    temperature = Column(Float, nullable=False)
    pressure = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    power_consumption = Column(Float, nullable=False)
    operating_status = Column(String(50), nullable=False)  # RUNNING, IDLE, STANDBY, STOPPED
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    validation_status = Column(String(20), default="VALID", nullable=False)  # VALID, REJECTED, SUSPICIOUS

    machine = relationship("Machine", back_populates="telemetry_records")
    sensor = relationship("Sensor")

Index("idx_telemetry_machine_time", Telemetry.machine_id, Telemetry.timestamp.desc())
