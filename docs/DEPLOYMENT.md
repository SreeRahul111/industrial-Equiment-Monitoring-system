# IEMS Production Deployment Guide

## 1. Docker Compose Deployment
```bash
# Build and run complete multi-tier stack
docker compose up -d --build

# Inspect service logs
docker compose logs -f

# Verify running services
docker compose ps
```
Services exposed:
- Web Application: `http://localhost:8080`
- FastAPI Backend (internal network): `http://backend:8000`
- PostgreSQL 16 (internal network): `postgres:5432`

## 2. Kubernetes Deployment
Ensure kubectl is configured to target your Kubernetes cluster:

```bash
# 1. Create isolated namespace
kubectl apply -f k8s/namespace.yaml

# 2. Deploy configuration & secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 3. Deploy backend services
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# 4. Deploy frontend services
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# Verify pod status
kubectl get pods -n iems-production
```
