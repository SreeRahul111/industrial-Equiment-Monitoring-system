import pytest
from backend.app.models.user import User

def test_valid_login(client, test_engineer_user):
    resp = client.post("/api/v1/auth/login", json={
        "email": test_engineer_user.email,
        "password": "EngPass123!"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_engineer_user.email
    assert data["user"]["role"] == "ENGINEER"

def test_invalid_password(client, test_engineer_user):
    resp = client.post("/api/v1/auth/login", json={
        "email": test_engineer_user.email,
        "password": "WrongPassword999!"
    })
    assert resp.status_code == 401
    assert "Invalid email or password" in resp.json()["detail"]

def test_inactive_account_denied(client, db_session, test_engineer_user):
    test_engineer_user.is_active = False
    db_session.commit()

    resp = client.post("/api/v1/auth/login", json={
        "email": test_engineer_user.email,
        "password": "EngPass123!"
    })
    assert resp.status_code == 403
    assert "deactivated" in resp.json()["detail"]

def test_protected_endpoint_without_token(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401

def test_protected_endpoint_with_valid_token(client, engineer_token):
    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {engineer_token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "ENGINEER"

def test_logout(client, engineer_token):
    resp = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {engineer_token}"}
    )
    assert resp.status_code == 200
    assert "Successfully logged out" in resp.json()["message"]
