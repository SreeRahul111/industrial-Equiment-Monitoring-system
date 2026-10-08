# Phase 15 — Logging, Monitoring, Hardening and Secure Deployment

## Security logging
IEMS records security-sensitive actions in the persistent AuditEvent model:
- LOGIN_SUCCESS
- LOGIN_FAILURE
- LOGIN_INACTIVE_DENIED
- authorization denials
- threshold modification
- alert acknowledgement
- alert resolution
- maintenance scheduling/update
- administrator actions

Secrets, passwords and bearer tokens must never be written to logs.

## Operational monitoring
The API exposes:
- /api/v1/health
- /api/v1/readiness
- /api/v1/metrics

Metrics include machine health, active alerts, telemetry ingestion rate, audit events, authentication failures, authorization denials and latest telemetry timestamp.

## Docker hardening
- multi-stage builds
- slim/alpine runtime images
- non-root backend
- explicit ports
- health checks
- .dockerignore
- no environment files or private keys copied into images

## Kubernetes hardening
- dedicated iems-production namespace
- backend ClusterIP service
- non-root backend security context
- dropped Linux capabilities
- privilege escalation disabled
- CPU/memory requests and limits
- readiness/liveness probes
- Kubernetes Secret reference for sensitive configuration
- frontend is the only externally exposed application service

## Deployment checklist
1. Provide secrets through the deployment platform, never Git.
2. Use immutable image tags.
3. Verify pod security context.
4. Verify resource limits.
5. Verify backend/database are not public.
6. Verify readiness/liveness probes.
7. Review audit and health endpoints after deployment.
8. Run the Phase 14 CI/security pipeline before release.
