def test_admin_can_access_admin_endpoints(client, admin_token):
    resp = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_engineer_denied_admin_endpoints(client, engineer_token):
    resp = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {engineer_token}"}
    )
    assert resp.status_code == 403

def test_viewer_denied_threshold_update(client, viewer_token, test_machine):
    resp = client.put(
        f"/api/v1/thresholds/{test_machine.id}",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={
            "temperature_min": 15.0,
            "temperature_max": 95.0,
            "pressure_min": 2.0,
            "pressure_max": 7.0,
            "vibration_max": 5.5,
            "power_min": 10.0,
            "power_max": 75.0,
            "reason": "Unauthorized attempt"
        }
    )
    assert resp.status_code == 403

def test_engineer_allowed_threshold_update(client, engineer_token, test_machine):
    resp = client.put(
        f"/api/v1/thresholds/{test_machine.id}",
        headers={"Authorization": f"Bearer {engineer_token}"},
        json={
            "temperature_min": 15.0,
            "temperature_max": 88.0,
            "pressure_min": 2.0,
            "pressure_max": 7.0,
            "vibration_max": 5.5,
            "power_min": 10.0,
            "power_max": 75.0,
            "reason": "Authorized recalibration"
        }
    )
    assert resp.status_code == 200
    assert resp.json()["temperature_max"] == 88.0
    assert resp.json()["version"] == 2

def test_viewer_denied_maintenance_creation(client, viewer_token, test_machine):
    resp = client.post(
        "/api/v1/maintenance",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={
            "machine_id": test_machine.id,
            "scheduled_date": "2026-10-15T10:00:00",
            "maintenance_type": "Bearing swap",
            "assigned_engineer": "Test Engineer"
        }
    )
    assert resp.status_code == 403
