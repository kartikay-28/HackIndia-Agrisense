import pytest


def test_register_success(client):
    response = client.post("/api/auth/register", json={
        "email": "farmer@test.com",
        "password": "password123",
        "name": "Test Farmer"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "farmer@test.com"


def test_register_duplicate_email(client):
    client.post("/api/auth/register", json={
        "email": "dup@test.com", "password": "pass123", "name": "Dup"
    })
    response = client.post("/api/auth/register", json={
        "email": "dup@test.com", "password": "pass456", "name": "Dup2"
    })
    assert response.status_code == 400


def test_login_success(client):
    client.post("/api/auth/register", json={
        "email": "login@test.com", "password": "pass123", "name": "Login User"
    })
    response = client.post("/api/auth/login", json={
        "email": "login@test.com", "password": "pass123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "wrong@test.com", "password": "correct", "name": "User"
    })
    response = client.post("/api/auth/login", json={
        "email": "wrong@test.com", "password": "incorrect"
    })
    assert response.status_code == 401


def test_get_me_authenticated(client):
    client.post("/api/auth/register", json={
        "email": "me@test.com", "password": "pass123", "name": "Me User"
    })
    login = client.post("/api/auth/login", json={
        "email": "me@test.com", "password": "pass123"
    })
    token = login.json()["access_token"]
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@test.com"


def test_get_me_unauthenticated(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
