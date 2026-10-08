import math
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.models.user import User, UserRole
from backend.app.models.machine import Machine, MachineStatus
from backend.app.models.sensor import Sensor
from backend.app.models.threshold import Threshold, ThresholdHistory
from backend.app.models.telemetry import Telemetry
from backend.app.models.alert import Alert, AlertSeverity, AlertStatus
from backend.app.models.maintenance import Maintenance, MaintenanceStatus
from backend.app.models.audit import AuditEvent
from backend.app.security.hashing import get_password_hash

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).first():
        return

    print(">>> Seeding IEMS database with industrial operations data...")

    # 1. Users (Dev credentials clearly marked)
    users = [
        User(
            email="admin@iems.industrial",
            password_hash=get_password_hash("AdminPassword123!"),
            name="Anita Rao",
            role=UserRole.ADMIN,
            is_active=True
        ),
        User(
            email="engineer@company.com",
            password_hash=get_password_hash("EngineerPassword123!"),
            name="Rahul Kumar",
            role=UserRole.ENGINEER,
            is_active=True
        ),
        User(
            email="viewer@company.com",
            password_hash=get_password_hash("ViewerPassword123!"),
            name="Meera Shah",
            role=UserRole.VIEWER,
            is_active=True
        )
    ]
    db.add_all(users)
    db.commit()

    # 2. Machines (12 industrial machines matching Figma overview)
    machine_defs = [
        ("MX-101", "Hydraulic Press", "Line A - Heavy Stamping", MachineStatus.NORMAL),
        ("MX-102", "Air Compressor", "Line B - Pneumatic Hub", MachineStatus.WARNING),
        ("MX-103", "CNC 5-Axis Mill", "Line A - Precision Machining", MachineStatus.NORMAL),
        ("MX-104", "Gas Turbine Generator", "Powerhouse - Primary", MachineStatus.CRITICAL),
        ("MX-105", "Automated Conveyor", "Packaging Hall - Line C", MachineStatus.NORMAL),
        ("MX-106", "Induction Furnace", "Foundry Sector 2", MachineStatus.NORMAL),
        ("MX-107", "Centrifugal Slurry Pump", "Effluent Treatment Plant", MachineStatus.NORMAL),
        ("MX-108", "Robotic Welder 04", "Body Assembly - Line D", MachineStatus.NORMAL),
        ("MX-109", "Shell & Tube Heat Exchanger", "Thermal Recovery Unit", MachineStatus.WARNING),
        ("MX-110", "Industrial Cooling Tower", "Utility Yard North", MachineStatus.NORMAL),
        ("MX-111", "Cleanroom Air Handling Unit", "Electronics Assembly Sub-bay", MachineStatus.NORMAL),
        ("MX-112", "Twin-Screw Plastic Extruder", "Polymer Processing Line", MachineStatus.NORMAL),
    ]

    machines = []
    for code, name, loc, st in machine_defs:
        m = Machine(machine_code=code, name=name, location=loc, status=st)
        db.add(m)
        machines.append(m)
    db.commit()

    # 3. Sensors & Thresholds for each machine
    for m in machines:
        # Sensors
        sensors = [
            Sensor(machine_id=m.id, sensor_type="Temperature", sensor_code=f"{m.machine_code}-TE-01", unit="°C"),
            Sensor(machine_id=m.id, sensor_type="Pressure", sensor_code=f"{m.machine_code}-PT-01", unit="bar"),
            Sensor(machine_id=m.id, sensor_type="Vibration", sensor_code=f"{m.machine_code}-VT-01", unit="mm/s"),
            Sensor(machine_id=m.id, sensor_type="Power", sensor_code=f"{m.machine_code}-KW-01", unit="kW"),
        ]
        db.add_all(sensors)

        # Baseline thresholds
        t_max = 90.0
        p_max = 8.0
        v_max = 6.0
        pw_max = 80.0

        if m.machine_code == "MX-102":
            t_max = 80.0
            p_max = 7.5
        elif m.machine_code == "MX-104":
            t_max = 90.0
            p_max = 8.0
            v_max = 6.0
        elif m.machine_code == "MX-109":
            pw_max = 70.0

        thresh = Threshold(
            machine_id=m.id,
            temperature_min=15.0,
            temperature_max=t_max,
            pressure_min=1.0,
            pressure_max=p_max,
            vibration_max=v_max,
            power_min=5.0,
            power_max=pw_max,
            version=1,
            created_by="system-init"
        )
        db.add(thresh)
    db.commit()

    # 4. Telemetry History (Last 24 hours of data points)
    now = datetime.utcnow()
    for m in machines:
        # Generate 24 hourly readings
        for h in range(24, -1, -1):
            ts = now - timedelta(hours=h, minutes=random.randint(0, 15))
            
            # Base normal values
            temp = round(65.0 + 5.0 * math.sin(h * 0.4) + random.uniform(-2, 2), 1)
            press = round(4.5 + 0.8 * math.cos(h * 0.3) + random.uniform(-0.3, 0.3), 1)
            vib = round(2.2 + 0.5 * math.sin(h * 0.5) + random.uniform(-0.2, 0.3), 1)
            pwr = round(48.0 + 10.0 * math.cos(h * 0.2) + random.uniform(-3, 3), 1)

            # Specific overrides for current abnormal states
            if m.machine_code == "MX-104":
                # Turbine is Critical vibration 8.7 mm/s, high temp 94°C
                if h <= 4:
                    vib = round(8.2 + (4 - h) * 0.15 + random.uniform(0, 0.2), 1)
                    temp = round(92.0 + (4 - h) * 0.5 + random.uniform(0, 0.5), 1)
                    press = 8.1
                    pwr = 72.0
            elif m.machine_code == "MX-102":
                # Compressor is Warning temp 81°C, pressure 6.8 bar
                if h <= 3:
                    temp = round(80.5 + (3 - h) * 0.2, 1)
                    press = 6.8
                    vib = 5.8
                    pwr = 62.0
            elif m.machine_code == "MX-109":
                # Heat exchanger power anomaly
                if h <= 2:
                    pwr = 74.5
                    temp = 73.0

            telem = Telemetry(
                machine_id=m.id,
                temperature=temp,
                pressure=press,
                vibration=vib,
                power_consumption=pwr,
                operating_status="RUNNING" if m.status != MachineStatus.OFFLINE else "STOPPED",
                timestamp=ts,
                validation_status="VALID"
            )
            db.add(telem)
    db.commit()

    # 5. Realistic Seed Alerts
    m_101 = next(m for m in machines if m.machine_code == "MX-101")
    m_104 = next(m for m in machines if m.machine_code == "MX-104")
    m_102 = next(m for m in machines if m.machine_code == "MX-102")
    m_109 = next(m for m in machines if m.machine_code == "MX-109")
    m_103 = next(m for m in machines if m.machine_code == "MX-103")

    alerts = [
        Alert(
            machine_id=m_104.id,
            alert_code="ALT-1042",
            alert_type="Vibration",
            severity=AlertSeverity.CRITICAL,
            measured_value=8.7,
            threshold_value=6.0,
            status=AlertStatus.ACTIVE,
            message="Vibration 8.7 mm/s exceeded the configured operating threshold (6.0 mm/s) by 45%.",
            created_at=now - timedelta(minutes=2)
        ),
        Alert(
            machine_id=m_102.id,
            alert_code="ALT-1041",
            alert_type="Temperature",
            severity=AlertSeverity.WARNING,
            measured_value=81.0,
            threshold_value=80.0,
            status=AlertStatus.ACKNOWLEDGED,
            message="Temperature 81.0°C exceeded high warning limit (80.0°C).",
            created_at=now - timedelta(minutes=8),
            acknowledged_at=now - timedelta(minutes=4),
            acknowledged_by="Rahul Kumar"
        ),
        Alert(
            machine_id=m_109.id,
            alert_code="ALT-1038",
            alert_type="Power",
            severity=AlertSeverity.WARNING,
            measured_value=74.5,
            threshold_value=70.0,
            status=AlertStatus.ACTIVE,
            message="Power draw 74.5 kW above baseline limit (70.0 kW).",
            created_at=now - timedelta(minutes=21)
        ),
        Alert(
            machine_id=m_103.id,
            alert_code="ALT-1032",
            alert_type="Vibration",
            severity=AlertSeverity.INFO,
            measured_value=4.1,
            threshold_value=5.0,
            status=AlertStatus.RESOLVED,
            message="Sensor reconnect and vibration self-stabilization confirmed.",
            created_at=now - timedelta(hours=1),
            acknowledged_at=now - timedelta(minutes=50),
            acknowledged_by="Rahul Kumar",
            resolved_at=now - timedelta(minutes=20),
            resolved_by="Anita Rao"
        )
    ]
    db.add_all(alerts)
    db.commit()

    # 6. Realistic Seed Maintenance Schedules
    maint_records = [
        Maintenance(
            machine_id=m_104.id,
            scheduled_date=now + timedelta(hours=2),
            maintenance_type="Turbine Vibration Bearing Inspection",
            assigned_engineer="Rahul Kumar",
            status=MaintenanceStatus.SCHEDULED,
            notes="Emergency inspection following ALT-1042 critical vibration spike."
        ),
        Maintenance(
            machine_id=m_102.id,
            scheduled_date=now + timedelta(days=1),
            maintenance_type="Air Compressor Valve & Oil Service",
            assigned_engineer="Rahul Kumar",
            status=MaintenanceStatus.SCHEDULED,
            notes="Cooling loop inspection and filter replacement."
        ),
        Maintenance(
            machine_id=m_109.id,
            scheduled_date=now + timedelta(days=4),
            maintenance_type="Heat Exchanger Tube Descaling",
            assigned_engineer="Anita Rao",
            status=MaintenanceStatus.SCHEDULED,
            notes="Routine thermal recovery cycle maintenance."
        ),
        Maintenance(
            machine_id=m_101.id,
            scheduled_date=now + timedelta(days=7),
            maintenance_type="Hydraulic Seal Routine Inspection",
            assigned_engineer="Rahul Kumar",
            status=MaintenanceStatus.SCHEDULED,
            notes="Quarterly hydraulic system pressure check."
        ),
    ]
    db.add_all(maint_records)
    db.commit()

    # 7. Seed Audit Events (matching wireframe Page 8)
    audit_events = [
        AuditEvent(
            actor_name="Rahul Kumar",
            actor_role="ENGINEER",
            action="THRESHOLD_MODIFICATION",
            target_type="THRESHOLD",
            target_id=str(m_102.id),
            result="ALLOWED",
            metadata_json='{"machine_code": "MX-102", "version": 2, "temp_max": 80.0}',
            timestamp=now - timedelta(minutes=18)
        ),
        AuditEvent(
            actor_name="Rahul Kumar",
            actor_role="ENGINEER",
            action="ALERT_ACKNOWLEDGED",
            target_type="ALERT",
            target_id="ALT-1041",
            result="ALLOWED",
            metadata_json='{"alert_code": "ALT-1041", "machine": "MX-102"}',
            timestamp=now - timedelta(minutes=29)
        ),
        AuditEvent(
            actor_name="Unknown",
            actor_role="UNKNOWN",
            action="UNAUTHORIZED_CONFIG_ATTEMPT",
            target_type="THRESHOLD",
            target_id=str(m_104.id),
            result="DENIED",
            metadata_json='{"ip": "192.168.1.105", "reason": "No credentials provided"}',
            timestamp=now - timedelta(minutes=48)
        ),
        AuditEvent(
            actor_name="Rahul Kumar",
            actor_role="ENGINEER",
            action="MAINTENANCE_SCHEDULED",
            target_type="MAINTENANCE",
            target_id=str(m_104.id),
            result="ALLOWED",
            metadata_json='{"machine_code": "MX-104", "type": "Vibration inspection"}',
            timestamp=now - timedelta(hours=1, minutes=2)
        ),
        AuditEvent(
            actor_name="Unauthorized",
            actor_role="UNKNOWN",
            action="LOGIN_FAILURE",
            target_type="USER_AUTH",
            target_id="engineer@company.com",
            result="DENIED",
            metadata_json='{"ip": "203.0.113.42", "reason": "Invalid credentials"}',
            timestamp=now - timedelta(hours=1, minutes=19)
        ),
    ]
    db.add_all(audit_events)
    db.commit()
    print(">>> IEMS database successfully seeded with 12 machines, sensors, telemetry, alerts, and audit trail.")
