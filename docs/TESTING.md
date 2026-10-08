# IEMS Automated Testing Documentation

## 1. Test Architecture Overview
IEMS maintains automated test coverage across both frontend and backend layers:

- **Backend (Python / pytest / TestClient)**:
  - Total tests: 20 passed (100% pass rate)
  - Execution command: `PYTHONPATH=. pytest backend/tests -v`
  - In-memory SQLite transaction rollback isolation per test case.
- **Frontend (Vitest / React Testing Library)**:
  - Total test suites: 3 passed, 6 unit tests
  - Execution command: `npm test`
  - Polyfilled localStorage and ResizeObserver for headless jsdom validation.
- **Security Analysis (Bandit)**:
  - Total lines scanned: 2,280 lines
  - Issues detected: 0 Medium or High severity issues
  - Execution command: `bandit -r backend/app -ll`

## 2. Test Coverage Matrix

### Backend Tests (`backend/tests/`)
1. `test_auth.py`:
   - `test_valid_login`: Successful credential verification and JWT generation.
   - `test_invalid_password`: Rejection with generic safe message.
   - `test_inactive_account_denied`: Deactivated user blocked with HTTP 403.
   - `test_protected_endpoint_without_token`: HTTP 401 on unauthenticated access.
   - `test_protected_endpoint_with_valid_token`: Profile retrieval.
   - `test_logout`: Audit-logged session termination.
2. `test_rbac.py`:
   - `test_admin_can_access_admin_endpoints`: Admin access granted.
   - `test_engineer_denied_admin_endpoints`: Engineer blocked with HTTP 403.
   - `test_viewer_denied_threshold_update`: Viewer blocked with HTTP 403.
   - `test_engineer_allowed_threshold_update`: Engineer authorized.
   - `test_viewer_denied_maintenance_creation`: Viewer blocked from mutation.
3. `test_telemetry.py`:
   - `test_valid_telemetry_ingestion`: Ingestion and validation success.
   - `test_telemetry_rejected_impossible_temperature`: Rejection on out-of-range sensor values (HTTP 422).
   - `test_telemetry_rejected_negative_vibration`: Physical boundary check.
   - `test_telemetry_rejected_unknown_machine`: Unknown machine ID rejected.
   - `test_telemetry_rejected_invalid_status_enum`: Status enum validation.
4. `test_alerts.py`:
   - `test_abnormal_vibration_triggers_alert`: Automatic alert generation, lifecycle acknowledgement, and resolution.
5. `test_thresholds.py`:
   - `test_threshold_validation_and_history`: Min < Max validation, version bump, and history retention.
6. `test_maintenance.py`:
   - `test_maintenance_lifecycle`: Schedule creation, status update, and viewer denial.
7. `test_audit.py`:
   - `test_audit_records_sensitive_operations`: Verification that login failures, threshold edits, and sensitive operations append audit records.

### Frontend Tests (`src/tests/`)
1. `Login.test.tsx`:
   - Renders form inputs, labels, and security notes.
   - Role preset switching updates input state.
2. `Dashboard.test.tsx`:
   - Renders `MetricCard` with labels, values, and status pills.
   - `StatusBadge` renders correct color styles.
3. `Thresholds.test.tsx`:
   - Renders `Modal` dialog and handles open/close states.
