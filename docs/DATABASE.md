# IEMS Database Schema Specification

Target Database: PostgreSQL 16
Development/Test Fallback: SQLite 3

## 1. Tables Overview

### `users`
- `id`: Integer Primary Key
- `email`: String(255) Unique Indexed
- `password_hash`: String(255) (Argon2id)
- `name`: String(255)
- `role`: Enum (`ADMIN`, `ENGINEER`, `VIEWER`)
- `is_active`: Boolean
- `created_at`: DateTime
- `updated_at`: DateTime
- `last_login_at`: DateTime Nullable

### `machines`
- `id`: Integer Primary Key
- `machine_code`: String(50) Unique Indexed (e.g. `MX-101`)
- `name`: String(255)
- `location`: String(255)
- `status`: Enum (`NORMAL`, `WARNING`, `CRITICAL`, `OFFLINE`)
- `created_at`: DateTime
- `updated_at`: DateTime

### `sensors`
- `id`: Integer Primary Key
- `machine_id`: ForeignKey `machines.id`
- `sensor_type`: String(50)
- `sensor_code`: String(50)
- `unit`: String(20)
- `status`: String(20)
- `created_at`: DateTime

### `telemetry`
- `id`: Integer Primary Key
- `machine_id`: ForeignKey `machines.id`
- `sensor_id`: ForeignKey `sensors.id` Nullable
- `temperature`: Float
- `pressure`: Float
- `vibration`: Float
- `power_consumption`: Float
- `operating_status`: String(50)
- `timestamp`: DateTime Indexed
- `validation_status`: String(20)

### `thresholds`
- `id`: Integer Primary Key
- `machine_id`: ForeignKey `machines.id` Unique
- `temperature_min`: Float
- `temperature_max`: Float
- `pressure_min`: Float
- `pressure_max`: Float
- `vibration_max`: Float
- `power_min`: Float
- `power_max`: Float
- `version`: Integer Default 1
- `created_by`: String(255)
- `created_at`: DateTime
- `updated_at`: DateTime

### `threshold_history`
- `id`: Integer Primary Key
- `threshold_id`: ForeignKey `thresholds.id`
- `machine_id`: ForeignKey `machines.id`
- `version`: Integer
- Historical limits (temp, pressure, vibration, power)
- `changed_by`: String(255)
- `change_reason`: String(255)
- `created_at`: DateTime

### `alerts`
- `id`: Integer Primary Key
- `machine_id`: ForeignKey `machines.id`
- `alert_code`: String(50) (e.g. `ALT-1042`)
- `alert_type`: String(100)
- `severity`: Enum (`CRITICAL`, `WARNING`, `INFO`)
- `measured_value`: Float
- `threshold_value`: Float
- `status`: Enum (`ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`)
- `message`: String(500)
- `created_at`: DateTime
- `acknowledged_at`: DateTime Nullable
- `acknowledged_by`: String(255) Nullable
- `resolved_at`: DateTime Nullable
- `resolved_by`: String(255) Nullable

### `maintenance`
- `id`: Integer Primary Key
- `machine_id`: ForeignKey `machines.id`
- `scheduled_date`: DateTime
- `maintenance_type`: String(100)
- `assigned_engineer`: String(255)
- `status`: Enum (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
- `notes`: Text Nullable
- `created_at`: DateTime
- `updated_at`: DateTime

### `audit_events`
- `id`: Integer Primary Key
- `actor_user_id`: Integer Nullable
- `actor_name`: String(255)
- `actor_role`: String(50)
- `action`: String(100)
- `target_type`: String(100)
- `target_id`: String(100)
- `result`: String(50) (`ALLOWED`, `DENIED`, `SUCCESS`, `FAILURE`)
- `metadata_json`: Text Nullable
- `timestamp`: DateTime
