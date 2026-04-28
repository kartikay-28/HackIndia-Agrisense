import pytest


def _register_and_login(client, email="farm_user@test.com"):
    client.post("/api/auth/register", json={
        "email": email, "password": "pass123", "name": "Farm User"
    })
    r = client.post("/api/auth/login", json={"email": email, "password": "pass123"})
    return r.json()["access_token"]


def test_create_farm(client):
    token = _register_and_login(client, "create_farm@test.com")
    response = client.post("/api/farms", json={
        "name": "My Farm",
        "latitude": 28.6,
        "longitude": 77.2,
        "state": "Punjab"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Farm"
    assert data["soil_type"] is not None  # Soil auto-detected


def test_get_farms(client):
    token = _register_and_login(client, "list_farms@test.com")
    client.post("/api/farms", json={
        "name": "Farm A", "latitude": 28.6, "longitude": 77.2, "state": "Punjab"
    }, headers={"Authorization": f"Bearer {token}"})
    response = client.get("/api/farms", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_farm_ownership(client):
    token1 = _register_and_login(client, "owner1@test.com")
    token2 = _register_and_login(client, "owner2@test.com")
    r = client.post("/api/farms", json={
        "name": "Owner1 Farm", "latitude": 28.6, "longitude": 77.2, "state": "Punjab"
    }, headers={"Authorization": f"Bearer {token1}"})
    farm_id = r.json()["id"]
    # User 2 tries to access user 1's farm
    response = client.get(f"/api/farms/{farm_id}", headers={"Authorization": f"Bearer {token2}"})
    assert response.status_code == 404


def test_delete_farm(client):
    token = _register_and_login(client, "delete_farm@test.com")
    r = client.post("/api/farms", json={
        "name": "To Delete", "latitude": 28.6, "longitude": 77.2, "state": "Punjab"
    }, headers={"Authorization": f"Bearer {token}"})
    farm_id = r.json()["id"]
    response = client.delete(f"/api/farms/{farm_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    # Verify deleted
    get_response = client.get(f"/api/farms/{farm_id}", headers={"Authorization": f"Bearer {token}"})
    assert get_response.status_code == 404
