# IEMS Security Architecture & Controls

## 1. Authentication Security
- **Algorithm**: Argon2id password hashing via `argon2-cffi` (memory-hard, resistant to GPU/ASIC brute forcing) with secure random salts.
- **Session Tokens**: Stateless JSON Web Tokens (JWT) using HMAC-SHA256 with explicit expiration (`iat`, `exp`, `nbf` claims verified).
- **Anti-Enumeration**: Consistent timing and generic error responses on failed login (`"Invalid email or password"`).
- **Failed Login Auditing**: Failed attempts, IP addresses, and unknown identifier queries are logged immediately in the audit trail.

## 2. Server-Side Role-Based Access Control (RBAC)
- Client-side navigation guards are strictly cosmetic; authorization checks are enforced at every FastAPI dependency layer:
  - `ADMIN`: User management, global configuration, threshold updates, alert actions, audit queries.
  - `ENGINEER`: Machine inspection, telemetry ingestion, threshold updates, alert acknowledgement/resolution, maintenance planning.
  - `VIEWER`: Read-only telemetry and alerts. Denied threshold updates and maintenance modifications with HTTP 403 Forbidden.
- Every unauthorized access attempt logs an `AUTHORIZATION_DENIAL` audit event with request path, IP, and required roles.

## 3. Telemetry Boundary Validation
- Zero-trust ingestion: Incoming sensor values undergo physical plausibility checks:
  - Out-of-bounds telemetry (e.g. impossible vibration or negative temperatures outside plausible range) is rejected with HTTP 422.
  - Sensor-to-machine validation ensures unregistered telemetry sources cannot tamper with machine status.

## 4. Tamper-Evident Audit Trail
- All state-mutating actions (threshold modifications, alert acknowledgements, resolutions, maintenance schedule changes, user enrollments) append records to `audit_events`.
- No user-facing API permits mutation or deletion of audit records.

## 5. Container & Platform Hardening
- Minimal base images (`python:3.11-slim`, `node:20-alpine`, `nginx:alpine`).
- Non-root container execution (`runAsUser: 10001`, `runAsNonRoot: true`).
- Dropped Linux capabilities (`drop: [ALL]`).
- Secrets managed exclusively via `.env`, GitHub Secrets, or Kubernetes Secrets.
