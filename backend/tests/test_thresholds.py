def test_threshold_validation_and_history(client, engineer_token, test_machine):
    # Invalid range: min > max
    bad_resp = client.put(
        f"/api/v1/thresholds/{test_machine.id}",
        headers={"Authorization": f"Bearer {engineer_token}"},
        json={
            "temperature_min": 95.0,
            "temperature_max": 90.0,
            "pressure_min": 1.0,
            "pressure_max": 8.0,
            "vibration_max": 6.0,
            "power_min": 5.0,
            "power_max": 80.0,
            "reason": "Faulty threshold attempt"
        }
    )
    assert bad_resp.status_code == 422
    assert "strictly less than" in bad_resp.json()["detail"]

    # Valid update
    ok_resp = client.put(
        f"/api/v1/thresholds/{test_machine.id}",
        headers={"Authorization": f"Bearer {engineer_token}"},
        json={
            "temperature_min": 15.0,
            "temperature_max": 92.0,
            "pressure_min": 1.5,
            "pressure_max": 8.5,
            "vibration_max": 5.8,
            "power_min": 6.0,
            "power_max": 75.0,
            "reason": "Summer operational mode"
        }
    )
    assert ok_resp.status_code == 200
    assert ok_resp.json()["version"] == 2
    assert ok_resp.json()["temperature_max"] == 92.0

    # Query history
    hist_resp = client.get(
        f"/api/v1/thresholds/{test_machine.id}/history",
        headers={"Authorization": f"Bearer {engineer_token}"}
    )
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) >= 1
    assert history[0]["changed_by"] == "Engineer User"
