import random
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.machine import Machine, MachineStatus
from backend.app.models.threshold import Threshold
from backend.app.models.alert import Alert, AlertSeverity, AlertStatus
from backend.app.models.telemetry import Telemetry
from backend.app.audit.audit_logger import log_audit_event

def evaluate_telemetry_and_generate_alerts(
    db: Session,
    machine: Machine,
    telemetry: Telemetry,
    threshold: Optional[Threshold] = None
) -> List[Alert]:
    """
    Evaluates incoming machine telemetry against configured thresholds,
    generates abnormal behavior alerts with deduplication, and adjusts machine status.
    """
    if not threshold:
        threshold = db.query(Threshold).filter(Threshold.machine_id == machine.id).first()
        if not threshold:
            # Default fallback thresholds
            threshold = Threshold(
                machine_id=machine.id,
                temperature_min=10.0,
                temperature_max=90.0,
                pressure_min=1.0,
                pressure_max=8.0,
                vibration_max=6.0,
                power_min=5.0,
                power_max=80.0,
                version=1,
                created_by="system"
            )
            db.add(threshold)
            db.commit()
            db.refresh(threshold)

    new_alerts: List[Alert] = []

    # Check metrics
    checks = [
        {
            "type": "Temperature",
            "val": telemetry.temperature,
            "unit": "°C",
            "min": threshold.temperature_min,
            "max": threshold.temperature_max,
            "crit_factor": 1.15
        },
        {
            "type": "Pressure",
            "val": telemetry.pressure,
            "unit": "bar",
            "min": threshold.pressure_min,
            "max": threshold.pressure_max,
            "crit_factor": 1.20
        },
        {
            "type": "Vibration",
            "val": telemetry.vibration,
            "unit": "mm/s",
            "min": None,
            "max": threshold.vibration_max,
            "crit_factor": 1.30
        },
        {
            "type": "Power",
            "val": telemetry.power_consumption,
            "unit": "kW",
            "min": threshold.power_min if telemetry.operating_status == "RUNNING" else None,
            "max": threshold.power_max,
            "crit_factor": 1.25
        }
    ]

    for check in checks:
        metric_type = check["type"]
        val = check["val"]
        unit = check["unit"]
        min_val = check["min"]
        max_val = check["max"]
        crit_factor = check["crit_factor"]

        is_abnormal = False
        severity = AlertSeverity.WARNING
        thresh_val = 0.0
        msg = ""

        if max_val is not None and val > max_val:
            is_abnormal = True
            thresh_val = max_val
            pct_over = ((val - max_val) / max_val) * 100
            if val >= (max_val * crit_factor):
                severity = AlertSeverity.CRITICAL
                msg = f"{metric_type} {val}{unit} critical violation! Exceeded safe threshold {max_val}{unit} by {pct_over:.1f}%."
            else:
                severity = AlertSeverity.WARNING
                msg = f"{metric_type} {val}{unit} warning: above configured limit {max_val}{unit} ({pct_over:.1f}% over)."
        elif min_val is not None and val < min_val:
            is_abnormal = True
            thresh_val = min_val
            severity = AlertSeverity.WARNING
            msg = f"{metric_type} {val}{unit} abnormal low: below configured minimum threshold {min_val}{unit}."

        if is_abnormal:
            # Check for existing active or unacknowledged alert to prevent alert storm
            existing_alert = db.query(Alert).filter(
                Alert.machine_id == machine.id,
                Alert.alert_type == metric_type,
                Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED])
            ).first()

            if existing_alert:
                # Update current readings and escalate severity if needed
                existing_alert.measured_value = val
                existing_alert.threshold_value = thresh_val
                if severity == AlertSeverity.CRITICAL and existing_alert.severity != AlertSeverity.CRITICAL:
                    existing_alert.severity = AlertSeverity.CRITICAL
                    existing_alert.message = msg
                db.commit()
            else:
                # Generate unique alert code ALT-XXXX
                count = db.query(Alert).count() + 1000
                alert_code = f"ALT-{count}"
                alert = Alert(
                    machine_id=machine.id,
                    alert_code=alert_code,
                    alert_type=metric_type,
                    severity=severity,
                    measured_value=val,
                    threshold_value=thresh_val,
                    status=AlertStatus.ACTIVE,
                    message=msg,
                    created_at=datetime.utcnow()
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)
                new_alerts.append(alert)

                log_audit_event(
                    db=db,
                    action="ALERT_DETECTED",
                    target_type="ALERT",
                    target_id=str(alert.id),
                    actor_name="Abnormal Detection Engine",
                    actor_role="SYSTEM",
                    result="SUCCESS",
                    metadata={
                        "machine_code": machine.machine_code,
                        "metric": metric_type,
                        "measured_value": val,
                        "threshold_value": thresh_val,
                        "severity": severity.value
                    }
                )

    # Re-evaluate machine overall status based on active alerts
    active_critical = db.query(Alert).filter(
        Alert.machine_id == machine.id,
        Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
        Alert.severity == AlertSeverity.CRITICAL
    ).first()

    active_warning = db.query(Alert).filter(
        Alert.machine_id == machine.id,
        Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
        Alert.severity == AlertSeverity.WARNING
    ).first()

    if active_critical:
        machine.status = MachineStatus.CRITICAL
    elif active_warning:
        machine.status = MachineStatus.WARNING
    else:
        machine.status = MachineStatus.NORMAL
    
    machine.updated_at = datetime.utcnow()
    db.commit()

    return new_alerts
