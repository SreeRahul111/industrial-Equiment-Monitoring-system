def test_system_workflow_login_machine_alert_audit(client, test_engineer_user, test_machine):
    login = client.post("/api/v1/auth/login", json={
        "email": test_engineer_user.email,
        "password": "EngPass123!"
    })
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    machines = client.get("/api/v1/machines", headers=headers)
    assert machines.status_code == 200

    machine = client.get(f"/api/v1/machines/{test_machine.id}", headers=headers)
    assert machine.status_code == 200

    alerts = client.get("/api/v1/alerts", headers=headers)
    assert alerts.status_code == 200

    audit = client.get("/api/v1/audit", headers=headers)
    assert audit.status_code == 200
