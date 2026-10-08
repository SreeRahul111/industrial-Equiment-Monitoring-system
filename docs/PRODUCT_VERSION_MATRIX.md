# IEMS Product Version Roadmap Matrix

| Version | Milestone | Scope & Deliverables | Verification Status |
| :--- | :--- | :--- | :--- |
| **v0.1.0** | **Foundation** | Repository structure, React + Vite application shell, FastAPI backend foundation, PostgreSQL schema, SQLite local dev fallback, Docker development environment. | **Completed & Verified** |
| **v0.2.0** | **Secure Access** | Argon2id password hashing, JWT stateless authentication, RBAC (ADMIN, ENGINEER, VIEWER), protected frontend routes, server-side authorization check, audit login logger. | **Completed & Verified** |
| **v0.3.0** | **Monitoring Core** | Machine registry (12+ machines), sensor registry, telemetry ingestion gateway, physical validation, machine dashboard, historical trends, SVG telemetry trend charts. | **Completed & Verified** |
| **v0.4.0** | **Detection & Alerts** | Abnormal behavior rules engine, multi-metric threshold evaluation, alert generation, deduplication logic, alert center, acknowledge/resolve workflows. | **Completed & Verified** |
| **v0.5.0** | **Operations & Audit** | Threshold configuration with version history, maintenance planner with calendar and list views, immutable audit event logger, security administration center. | **Completed & Verified** |
| **v0.6.0** | **Secure Platform** | Multi-stage Docker builds, non-root runtime images, Kubernetes manifests, GitHub Actions CI pipeline, static security scanning (Bandit), observability & health endpoints. | **Completed & Verified** |
| **v1.0.0** | **Production Release** | End-to-end integration, automated test suites (pytest + Vitest), security verification, comprehensive architecture and deployment documentation. | **Completed & Verified** |
