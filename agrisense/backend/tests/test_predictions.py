import pytest
from unittest.mock import patch, AsyncMock


MOCK_WEATHER = {
    "current_temp": 28.0,
    "current_humidity": 65.0,
    "current_rainfall_1h": 0.0,
    "weekly_rainfall_forecast_mm": 50.0,
    "avg_temp_7day": 27.5,
    "weather_description": "partly cloudy",
    "forecast_7day": []
}


def _register_and_login(client, email):
    client.post("/api/auth/register", json={"email": email, "password": "pass123", "name": "User"})
    r = client.post("/api/auth/login", json={"email": email, "password": "pass123"})
    return r.json()["access_token"]


def _create_farm(client, token):
    r = client.post("/api/farms", json={
        "name": "Test Farm", "latitude": 28.6, "longitude": 77.2, "state": "Punjab"
    }, headers={"Authorization": f"Bearer {token}"})
    return r.json()["id"]


@patch("app.routers.predictions.get_weather_safe", new_callable=AsyncMock, return_value=MOCK_WEATHER)
def test_prediction_returns_5_crops(mock_weather, client):
    token = _register_and_login(client, "pred1@test.com")
    farm_id = _create_farm(client, token)
    response = client.get(f"/api/predict/crop/{farm_id}",
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) == 5


@patch("app.routers.predictions.get_weather_safe", new_callable=AsyncMock, return_value=MOCK_WEATHER)
def test_risk_levels_valid(mock_weather, client):
    token = _register_and_login(client, "pred2@test.com")
    farm_id = _create_farm(client, token)
    response = client.get(f"/api/predict/crop/{farm_id}",
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    for rec in response.json()["recommendations"]:
        assert rec["risk_level"] in ["Low", "Medium", "High"]


@patch("app.routers.predictions.get_weather_safe", new_callable=AsyncMock, return_value=MOCK_WEATHER)
def test_match_scores_in_range(mock_weather, client):
    token = _register_and_login(client, "pred3@test.com")
    farm_id = _create_farm(client, token)
    response = client.get(f"/api/predict/crop/{farm_id}",
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    for rec in response.json()["recommendations"]:
        assert 0 <= rec["match_score"] <= 100
