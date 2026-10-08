from fastapi import APIRouter
from backend.app.api.auth import router as auth_router
from backend.app.api.machines import router as machines_router
from backend.app.api.telemetry import router as telemetry_router
from backend.app.api.alerts import router as alerts_router
from backend.app.api.thresholds import router as thresholds_router
from backend.app.api.maintenance import router as maintenance_router
from backend.app.api.audit import router as audit_router
from backend.app.api.admin import router as admin_router
from backend.app.api.health import router as health_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(machines_router)
api_router.include_router(telemetry_router)
api_router.include_router(alerts_router)
api_router.include_router(thresholds_router)
api_router.include_router(maintenance_router)
api_router.include_router(audit_router)
api_router.include_router(admin_router)
api_router.include_router(health_router)
