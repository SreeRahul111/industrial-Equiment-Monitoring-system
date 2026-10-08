def test_abnormal_vibration_triggers_alert(client, engineer_token, test_machine):
    # Threshold vibration max is 6.0 mm/s. Ingesting 8.5 mm/s should generate a CRITICAL alert.
    resp = client.post("/api/v1/telemetry", json={
        "machine_id": test_machine.id,
        "temperature": 70.0,
        "pressure": 5.0,
        "vibration": 8.5,
        "power_consumption": 40.0,
        "operating_status": "RUNNING"
    })
    assert resp.status_code == 201

    # Check alert list
    alerts_resp = client.get(
        "/api/v1/alerts",
        headers={"Authorization": f"Bearer {engineer_token}"}
    )
    assert alerts_resp.status_code == 200
    alerts = alerts_resp.json()
    assert len(alerts) >= 1
    target_alert = next(a for a in alerts if a["machine_id"] == test_machine.id and a["alert_type"] == "Vibration")
    assert target_alert["severity"] == "CRITICAL"
    assert target_alert["status"] == "ACTIVE"

    # Acknowledge the alert
    ack_resp = client.post(
        f"/api/v1/alerts/{target_alert['id']}/acknowledge",
        headers={"Authorization": f"Bearer {engineer_token}"},
        json={"note": "Reviewed by engineer on duty"}
    )
    assert ack_resp.status_code == 200
    assert ack_resp.json()["status"] == "ACKNOWLEDGED"
    assert ack_resp.json()["acknowledged_by"] == "Engineer User"

    # Resolve the alert
    res_resp = client.post(
        f"/api/v1/alerts/{target_alert['id']}/resolve",
        headers={"Authorization": f"Bearer {engineer_token}"},
        json={"resolution_note": "Replaced damper assembly, readings normal"}
    )
    assert res_resp.status_code == 200
    assert res_resp.json()["status"] == "RESOLVED"
    assert res_resp.json()["resolved_by"] == "Engineer User"
