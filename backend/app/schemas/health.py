from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel

class ServiceHealthStatus(BaseModel):
    status: str
    latency_ms: Optional[float] = None
    message: Optional[str] = None

class HealthOut(BaseModel):
    status: str
    uptime_seconds: float
    timestamp: datetime
    services: Dict[str, ServiceHealthStatus]

class ReadinessOut(BaseModel):
    ready: bool
    database_connected: bool
    version: str

class MetricsOut(BaseModel):
    total_machines: int
    normal_machines: int
    warning_machines: int
    critical_machines: int
    active_alerts: int
    telemetry_ingestion_rate_per_min: float
    audit_events_24h: int
    auth_failures_24h: int
    denied_actions_24h: int
    latest_telemetry_timestamp: Optional[datetime] = None
