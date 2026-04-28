import httpx
import logging
from cachetools import TTLCache
from app.config import settings

logger = logging.getLogger(__name__)

# 1-hour TTL cache, max 200 entries
weather_cache = TTLCache(maxsize=200, ttl=3600)


async def get_weather_for_farm(farm_id: str, lat: float, lon: float) -> dict:
    """
    Returns weather data for a farm location.
    Checks cache first. If miss, calls OpenWeatherMap API.
    Caches result keyed by farm_id.
    """
    cache_key = f"weather_{farm_id}"

    if cache_key in weather_cache:
        logger.info(f"Cache HIT for farm {farm_id}")
        return weather_cache[cache_key]

    logger.info(f"Cache MISS for farm {farm_id} — fetching from OpenWeatherMap")

    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.OPENWEATHER_API_KEY,
        "units": "metric",
        "cnt": 40  # 5-day forecast in 3-hour steps
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()

    # Also get current weather
    current_url = "https://api.openweathermap.org/data/2.5/weather"
    async with httpx.AsyncClient() as client:
        current_response = await client.get(current_url, params={
            "lat": lat, "lon": lon,
            "appid": settings.OPENWEATHER_API_KEY,
            "units": "metric"
        }, timeout=10.0)
        current_response.raise_for_status()
        current_data = current_response.json()

    # Parse forecast list into daily summaries
    from collections import defaultdict
    daily: dict = defaultdict(lambda: {"temps": [], "rain": 0.0, "humidity": []})
    for item in data.get("list", []):
        day_key = item["dt_txt"][:10]
        daily[day_key]["temps"].append(item["main"]["temp"])
        daily[day_key]["rain"] += item.get("rain", {}).get("3h", 0.0)
        daily[day_key]["humidity"].append(item["main"]["humidity"])

    forecast_7day = []
    for day_key in sorted(daily.keys())[:7]:
        d = daily[day_key]
        import datetime as dt
        ts = int(dt.datetime.strptime(day_key, "%Y-%m-%d").timestamp())
        forecast_7day.append({
            "date": ts,
            "temp_day": sum(d["temps"]) / len(d["temps"]) if d["temps"] else 25.0,
            "rain": d["rain"],
            "humidity": int(sum(d["humidity"]) / len(d["humidity"])) if d["humidity"] else 60
        })

    weekly_rain = sum(f["rain"] for f in forecast_7day)
    avg_temp    = sum(f["temp_day"] for f in forecast_7day) / max(len(forecast_7day), 1)

    weather_summary = {
        "current_temp": current_data["main"]["temp"],
        "current_humidity": current_data["main"]["humidity"],
        "current_rainfall_1h": current_data.get("rain", {}).get("1h", 0),
        "weekly_rainfall_forecast_mm": round(weekly_rain, 1),
        "avg_temp_7day": round(avg_temp, 1),
        "weather_description": current_data["weather"][0]["description"],
        "forecast_7day": forecast_7day
    }

    weather_cache[cache_key] = weather_summary
    return weather_summary


def get_mock_weather(lat: float, lon: float) -> dict:
    """
    Returns mock weather data for development/testing when API key is not set.
    """
    base_temp = max(10, min(45, 35 - abs(lat - 20) * 0.5))
    return {
        "current_temp": round(base_temp, 1),
        "current_humidity": 65,
        "current_rainfall_1h": 0.0,
        "weekly_rainfall_forecast_mm": 45.0,
        "avg_temp_7day": round(base_temp - 1, 1),
        "weather_description": "partly cloudy",
        "forecast_7day": [
            {
                "date": 1700000000 + i * 86400,
                "temp_day": round(base_temp + (i % 3 - 1), 1),
                "rain": 5.0 if i % 3 == 0 else 0.0,
                "humidity": 65
            }
            for i in range(7)
        ]
    }


async def get_weather_safe(farm_id: str, lat: float, lon: float) -> dict:
    """
    Wrapper that falls back to mock data if API key is missing or call fails.
    """
    if not settings.OPENWEATHER_API_KEY:
        logger.warning("OPENWEATHER_API_KEY not set — using mock weather data")
        return get_mock_weather(lat, lon)

    try:
        return await get_weather_for_farm(farm_id, lat, lon)
    except Exception as e:
        logger.error(f"Weather API error for farm {farm_id}: {e}")
        return get_mock_weather(lat, lon)
