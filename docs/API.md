# IEMS REST API Specification

Base URL: `/api/v1`

## 1. Authentication
- `POST /auth/login`: Authenticate engineer and return Bearer token.
  - Body: `{ email, password }`
- `GET /auth/me`: Return authenticated profile.
  - Requires: Any authenticated role (`ADMIN`, `ENGINEER`, `VIEWER`).
- `POST /auth/logout`: Log session termination and record audit log.

## 2. Machines
- `GET /machines`: List machines with search, status filter, and latest telemetry.
- `POST /machines`: Register new machine (Requires: `ADMIN` or `ENGINEER`).
- `GET /machines/{id}`: Detailed machine telemetry, sensor inventory, active thresholds.
- `PUT /machines/{id}`: Update machine metadata (Requires: `ADMIN` or `ENGINEER`).

## 3. Telemetry Ingestion & History
- `GET /machines/{id}/telemetry?hours=24`: Historical telemetry trends for charts.
- `POST /telemetry`: High-throughput sensor ingestion endpoint.
  - Physical plausibility validation:
    - Temperature: `[-40, 200] °C`
    - Pressure: `[0, 100] bar`
    - Vibration: `[0, 50] mm/s`
    - Power: `[0, 1000] kW`
    - Operating status: `RUNNING | IDLE | STANDBY | STOPPED`

## 4. Alerts
- `GET /alerts`: List alerts with severity, status, machine, and keyword filters.
- `GET /alerts/{id}`: Retrieve alert details and incident context.
- `POST /alerts/{id}/acknowledge`: Mark alert acknowledged with engineer note (Requires: `ADMIN` or `ENGINEER`).
- `POST /alerts/{id}/resolve`: Resolve alert, clear machine critical state, and audit (Requires: `ADMIN` or `ENGINEER`).

## 5. Thresholds
- `GET /thresholds/{machine_id}`: Get active monitoring thresholds.
- `PUT /thresholds/{machine_id}`: Modify thresholds with version bump and history archival (Requires: `ADMIN` or `ENGINEER`).
- `GET /thresholds/{machine_id}/history`: Fetch previous configuration revisions.

## 6. Maintenance
- `GET /maintenance`: Query work orders and schedules.
- `POST /maintenance`: Schedule maintenance activity (Requires: `ADMIN` or `ENGINEER`).
- `PUT /maintenance/{id}`: Update work order status (Requires: `ADMIN` or `ENGINEER`).

## 7. Audit & Security
- `GET /audit`: Query tamper-evident event log with filters for actor, action, result.

## 8. Administration
- `GET /admin/users`: List users (Requires: `ADMIN`).
- `POST /admin/users`: Create user (Requires: `ADMIN`).
- `PUT /admin/users/{id}`: Update role or name (Requires: `ADMIN`).
- `PATCH /admin/users/{id}/status`: Enable/disable user (Requires: `ADMIN`).

## 9. Observability & Health
- `GET /health`: Microservice health checks and component latencies.
- `GET /readiness`: Kubernetes readiness probe.
- `GET /metrics`: Aggregated operations metrics.
