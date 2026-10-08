# Industrial Equipment Monitoring System (IEMS)

[![CI/CD](https://github.com/org/iems/actions/workflows/ci.yml/badge.svg)](https://github.com/org/iems)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Security: Bandit](https://img.shields.io/badge/Security-Bandit%20Passed-brightgreen)](docs/SECURITY.md)

An enterprise-grade cyber-physical operations platform designed for continuous industrial equipment monitoring, real-time sensor telemetry ingestion, automated abnormal behavior detection, threshold guardrails, maintenance scheduling, and tamper-evident security auditing.

Built to directly reflect the Figma specification: [IEMS Phase 6 Professional UI/UX](https://www.figma.com/design/qgALm4ClDNlCbBGTz8uzP2).

---

## Key Features

1. **Mission-Critical Telemetry Monitoring**: Live telemetry ingestion for Temperature (°C), Pressure (bar), Vibration (mm/s), and Power Consumption (kW) across 12 industrial assets.
2. **Abnormal Behavior Rules Engine**: Real-time evaluation against configurable physical thresholds with automatic alert generation and deduplication.
3. **Security-First RBAC**: Strict server-side authorization enforcement across `ADMIN`, `ENGINEER`, and `VIEWER` roles.
4. **Argon2id & JWT Authentication**: Cryptographically resilient password hashing and stateless token management.
5. **Tamper-Evident Audit Trail**: Every sensitive operation (threshold revisions, logins, alert actions, maintenance schedules) is permanently recorded with actor identity, IP, and payload diffs.
6. **Operational Maintenance Planner**: Interactive calendar matrix and work order tracking.
7. **Production Platform Readiness**: Multi-stage Dockerfiles with non-root security context, Kubernetes manifests, and GitHub Actions CI pipeline.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite 6, React Router 7, Lucide React, Vitest, Testing Library.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, PyJWT, Argon2-cffi, pytest, httpx, Bandit.
- **Database**: PostgreSQL 16 (Production Target) / SQLite 3 (Zero-setup local development fallback).
- **Infrastructure**: Docker, Docker Compose, Kubernetes, GitHub Actions.

---

## 10 Production Screens

| Screen | Route | Role Access | Description |
| :--- | :--- | :--- | :--- |
| **1. Secure Engineer Login** | `/login` | Public | Split-screen branding, Argon2id authentication, role selector chips for testing. |
| **2. Overview Dashboard** | `/overview` | Authenticated | 4 KPI cards, live machine status table, active critical alert banner, quick actions. |
| **3. Machines Registry** | `/machines` | Authenticated | Complete machinery list with search, status filters, and enrollment modal. |
| **4. Machine Detail** | `/machines/:id` | Authenticated | Telemetry trend SVG charts (1h/6h/24h/7d), condition monitor, live telemetry injector. |
| **5. Alert Center** | `/alerts` | Authenticated | Queue triage, 4-step lifecycle tracking, engineer acknowledgement & resolution. |
| **6. Threshold Configuration** | `/thresholds` | Engineer / Admin | Validated thresholds, 4-step security guardrails, version history. |
| **7. Maintenance Planner** | `/maintenance` | Authenticated | Calendar matrix and work order tracker, maintenance creation modal. |
| **8. Audit & Security Center** | `/audit` | Authenticated | Tamper-evident ledger of events with Allowed/Denied filters & payload inspector. |
| **9. Administration** | `/admin` | Admin Only | User enrollment, access control, account disablement, role reassignment. |
| **10. System Health & Settings**| `/health` | Authenticated | Microservice status, database latencies, security policy indicators. |

---

## Quickstart (Local Development)

### 1. Backend Setup

```bash
# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Start FastAPI server on port 8000
PYTHONPATH=. uvicorn backend.app.main:app --reload --port 8000
```

*Note: On first launch, the database `./iems.db` is automatically created and populated with 12 machines, sensors, baseline thresholds, 24h telemetry history, alerts, and audit records.*

### 2. Frontend Setup

In a separate terminal:

```bash
# Install Node dependencies
npm install

# Start Vite dev server on port 5173
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## Development Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@iems.industrial` | `AdminPassword123!` | Full administration, user management, thresholds, alerts, audit. |
| **ENGINEER** | `engineer@company.com` | `EngineerPassword123!` | Live monitoring, threshold updates, alert actions, maintenance. |
| **VIEWER** | `viewer@company.com` | `ViewerPassword123!` | Read-only observation. Modifying thresholds/maintenance returns 403. |

---

## Testing & Verification

### Run Backend Tests (20 tests passed)
```bash
source .venv/bin/activate
PYTHONPATH=. pytest backend/tests -v
```

### Run Frontend Tests (6 tests passed)
```bash
npm test
```

### Run Production Build
```bash
npm run build
```

### Run Security Static Analysis (Bandit)
```bash
source .venv/bin/activate
bandit -r backend/app -ll
```

---

## Container & Kubernetes Deployment

### Docker Compose (Multi-Tier Stack)
```bash
docker compose up -d --build
```
Access the web application at `http://localhost:8080`.

### Kubernetes
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

---

## Documentation Index

- [Architecture Overview](docs/ARCHITECTURE.md)
- [REST API Reference](docs/API.md)
- [Database Schema & Data Model](docs/DATABASE.md)
- [Security Architecture & Controls](docs/SECURITY.md)
- [Local Development Guide](docs/DEVELOPMENT.md)
- [Deployment Guide (Docker & K8s)](docs/DEPLOYMENT.md)
- [Product Version Matrix](docs/PRODUCT_VERSION_MATRIX.md)
- [Figma & Wireframe Implementation Mapping](docs/FIGMA_IMPLEMENTATION.md)
- [Automated Testing Documentation](docs/TESTING.md)
