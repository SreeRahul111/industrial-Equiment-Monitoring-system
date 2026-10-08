def test_maintenance_lifecycle(client, engineer_token, viewer_token, test_machine):
    # Create maintenance as engineer
    create_resp = client.post(
        "/api/v1/maintenance",
        headers={"Authorization": f"Bearer {engineer_token}"},
        json={
            "machine_id": test_machine.id,
            "scheduled_date": "2026-10-20T08:00:00",
            "maintenance_type": "Filter Replacement & Lubrication",
            "assigned_engineer": "Rahul Kumar",
            "notes": "Scheduled 2000-hr overhaul"
        }
    )
    assert create_resp.status_code == 201
    item_id = create_resp.json()["id"]

    # Update maintenance as engineer
    update_resp = client.put(
        f"/api/v1/maintenance/{item_id}",
        headers={"Authorization": f"Bearer {engineer_token}"},
        json={"status": "IN_PROGRESS", "notes": "Technician arrived on site"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "IN_PROGRESS"

    # Unauthorized update as viewer
    denied_resp = client.put(
        f"/api/v1/maintenance/{item_id}",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={"status": "COMPLETED"}
    )
    assert denied_resp.status_code == 403
