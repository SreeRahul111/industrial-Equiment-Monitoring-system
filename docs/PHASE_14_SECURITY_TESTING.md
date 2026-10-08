# Phase 14 — CI/CD and Security Testing

## Scope
IEMS CI/CD validates backend tests, frontend tests/build, dependency security, static security analysis, secret scanning, filesystem scanning, and Docker image scanning.

## Automated checks
- Backend pytest suite
- Frontend Vitest suite and production build
- Bandit
- pip-audit
- npm audit
- Gitleaks
- Trivy filesystem scan
- Trivy backend image scan
- Trivy frontend image scan

## Test levels
- Unit: authentication, RBAC, telemetry validation, thresholds, alerts and maintenance.
- Integration: authenticated engineer login -> protected threshold retrieval/update.
- System workflow: login -> machine access -> alert access -> audit access.
- Boundary/fuzz-style inputs: impossible telemetry values and unauthorized role operations are rejected.

## Defect and regression control
A security weakness is only recorded as fixed after a reproducible test demonstrates the corrected behavior. Current hardening includes replacing wildcard credentialed CORS with an explicit allow-list and keeping server-side RBAC as the authorization boundary.

## Evidence rule
A check is marked PASS only when its CI job actually executes successfully. Configuration alone is not treated as execution evidence.
