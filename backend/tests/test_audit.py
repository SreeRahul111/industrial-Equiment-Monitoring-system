def test_audit_records_sensitive_operations(client, engineer_token, admin_token, test_machine):
    # Trigger failed login
    client.post("/api/v1/auth/login", json={
        "email": "attacker@intruder.com",
        "password": "WrongPassword!"
    })

    # Trigger threshold modification
    client.put(
        f"/api/v1/thresholds/{test_machine.id}",
        headers={"Authorization": f"Bearer {engineer_token}"},
        json={
            "temperature_min": 12.0,
            "temperature_max": 91.0,
            "pressure_min": 1.2,
            "pressure_max": 7.8,
            "vibration_max": 5.9,
            "power_min": 5.0,
            "power_max": 80.0,
            "reason": "Audit verification check"
        }
    )

    # Fetch audit logs as engineer
    audit_resp = client.get(
        "/api/v1/audit",
        headers={"Authorization": f"Bearer {engineer_token}"}
    )
    assert audit_resp.status_code == 200
    events = audit_resp.json()
    assert len(events) >= 2

    actions = [e["action"] for e in events]
    assert "LOGIN_FAILURE" in actions
    assert "THRESHOLD_MODIFICATION" in actions
