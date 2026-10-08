def test_login_to_protected_threshold_flow(client, test_engineer_user, test_machine):
    login = client.post("/api/v1/auth/login", json={
        "email": test_engineer_user.email,
        "password": "EngPass123!"
    })
    assert login.status_code == 200
    token = login.json()["access_token"]

    threshold = client.get(
        f"/api/v1/thresholds/{test_machine.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert threshold.status_code == 200

    update = client.put(
        f"/api/v1/thresholds/{test_machine.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "temperature_min": 15.0,
            "temperature_max": 90.0,
            "pressure_min": 1.0,
            "pressure_max": 8.0,
            "vibration_max": 6.0,
            "power_min": 5.0,
            "power_max": 80.0,
            "reason": "Integration security test"
        }
    )
    assert update.status_code == 200


def test_security_boundary_inputs_are_rejected(client, engineer_token, test_machine):
    invalid_payloads = [
        {"temperature": 999999, "pressure": 2, "vibration": 1, "power": 20},
        {"temperature": 20, "pressure": -1, "vibration": 1, "power": 20},
        {"temperature": 20, "pressure": 2, "vibration": -1, "power": 20},
    ]

    for payload in invalid_payloads:
        payload["machine_id"] = test_machine.id
        response = client.post(
            "/api/v1/telemetry",
            headers={"Authorization": f"Bearer {engineer_token}"},
            json=payload,
        )
        assert response.status_code in (400, 422)


def test_viewer_cannot_modify_thresholds(client, viewer_token, test_machine):
    response = client.put(
        f"/api/v1/thresholds/{test_machine.id}",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={
            "temperature_min": 15,
            "temperature_max": 90,
            "pressure_min": 1,
            "pressure_max": 8,
            "vibration_max": 6,
            "power_min": 5,
            "power_max": 80,
            "reason": "Privilege escalation attempt"
        },
    )
    assert response.status_code == 403
