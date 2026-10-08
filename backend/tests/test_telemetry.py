def test_valid_telemetry_ingestion(client, test_machine):
    resp = client.post("/api/v1/telemetry", json={
        "machine_id": test_machine.id,
        "temperature": 72.5,
        "pressure": 5.1,
        "vibration": 2.4,
        "power_consumption": 45.0,
        "operating_status": "RUNNING"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["temperature"] == 72.5
    assert data["validation_status"] == "VALID"

def test_telemetry_rejected_impossible_temperature(client, test_machine):
    # Temperature 250 is outside [-40, 200]
    resp = client.post("/api/v1/telemetry", json={
        "machine_id": test_machine.id,
        "temperature": 250.0,
        "pressure": 5.0,
        "vibration": 2.0,
        "power_consumption": 40.0,
        "operating_status": "RUNNING"
    })
    assert resp.status_code == 422

def test_telemetry_rejected_negative_vibration(client, test_machine):
    resp = client.post("/api/v1/telemetry", json={
        "machine_id": test_machine.id,
        "temperature": 70.0,
        "pressure": 5.0,
        "vibration": -5.0,
        "power_consumption": 40.0,
        "operating_status": "RUNNING"
    })
    assert resp.status_code == 422

def test_telemetry_rejected_unknown_machine(client):
    resp = client.post("/api/v1/telemetry", json={
        "machine_id": 999999,
        "temperature": 70.0,
        "pressure": 5.0,
        "vibration": 2.0,
        "power_consumption": 40.0,
        "operating_status": "RUNNING"
    })
    assert resp.status_code == 404

def test_telemetry_rejected_invalid_status_enum(client, test_machine):
    resp = client.post("/api/v1/telemetry", json={
        "machine_id": test_machine.id,
        "temperature": 70.0,
        "pressure": 5.0,
        "vibration": 2.0,
        "power_consumption": 40.0,
        "operating_status": "INVALID_STATE_BLAH"
    })
    assert resp.status_code == 422
