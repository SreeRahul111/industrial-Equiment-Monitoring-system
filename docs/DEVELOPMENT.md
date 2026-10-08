# IEMS Local Development Guide

## Prerequisites
- Node.js >= 18.x (tested on v26.7.0) & npm >= 9.x
- Python >= 3.10 (tested on v3.14.3)
- Optional: Docker & Docker Compose

## 1. Setup Backend
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run backend development server
PYTHONPATH=. uvicorn backend.app.main:app --reload --port 8000
```
On startup, the backend automatically initializes tables in `./iems.db` (or target PostgreSQL) and seeds 12 machines, sensors, baseline thresholds, 24h of telemetry readings, alerts, and audit events.

### Development Credentials
- **Admin**: `admin@iems.industrial` / `AdminPassword123!`
- **Engineer**: `engineer@company.com` / `EngineerPassword123!`
- **Viewer**: `viewer@company.com` / `ViewerPassword123!`

## 2. Setup Frontend
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend dev server runs on `http://localhost:5173` and proxies API requests `/api/*` to `http://127.0.0.1:8000`.

## 3. Automated Testing
```bash
# Run backend tests
PYTHONPATH=. pytest backend/tests -v

# Run frontend tests
npm test

# Run static security scanning
bandit -r backend/app -ll
```
