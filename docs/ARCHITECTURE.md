# IEMS System Architecture

## 1. Overview
The Industrial Equipment Monitoring System (IEMS) is an enterprise-grade cyber-physical operations platform designed for real-time telemetry observation, abnormal behavioral detection, automated alarming, operational maintenance management, and rigorous tamper-evident auditing.

```
                      +-----------------------------+
                      |     Industrial Sensors      |
                      | (Temp, Press, Vib, Power)   |
                      +--------------+--------------+
                                     |
                                     v HTTP POST /telemetry
+-------------------+        +-------+--------------+       +---------------------+
|    Web Client     |        |   FastAPI Gateway    |       |   PostgreSQL / DB   |
| (React/Vite SPA)  +------->+  (Auth, RBAC, Val)   +------>+ (Audit, Thresholds, |
+-------------------+        +-------+--------------+       |  Machines, Alerts)  |
                                     |                      +---------------------+
                                     v
                             +-------+--------------+
                             | Abnormal Engine      |
                             | (Threshold vs State) |
                             +----------------------+
```

## 2. Component Layers
1. **Presentation Layer (Frontend SPA)**:
   - Built with React 19, TypeScript, Vite, React Router 7, and Lucide React.
   - Design system mapped 1-to-1 against Figma wireframe system with responsive mobile/desktop layouts.
2. **API & Business Logic Layer (FastAPI)**:
   - FastAPI RESTful routers with Pydantic v2 schema validation.
   - Ingestion gateway with physical boundary validation.
   - Abnormal behavior engine preventing alert storms via active state deduplication.
3. **Security Layer**:
   - Argon2id password hashing algorithm.
   - JWT stateless token architecture with server-side RBAC authorization verification.
   - Centralized audit trail recorder for all state-mutating operations.
4. **Data Persistence Layer**:
   - SQLAlchemy 2.0 ORM with PostgreSQL production target and SQLite local development/testing fallback.
