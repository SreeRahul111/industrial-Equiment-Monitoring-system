from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_type = Column(String(50), nullable=False)  # temperature, pressure, vibration, power
    sensor_code = Column(String(50), nullable=False)
    unit = Column(String(20), nullable=False)          # °C, bar, mm/s, kW
    status = Column(String(20), default="ACTIVE", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    machine = relationship("Machine", back_populates="sensors")
