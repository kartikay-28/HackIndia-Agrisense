from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class WeatherData(BaseModel):
    """Schema for weather data."""
    current_temp: float
    current_humidity: float
    current_rainfall_1h: float
    weekly_rainfall_forecast_mm: float
    avg_temp_7day: float
    weather_description: str


class CropRecommendation(BaseModel):
    """Schema for individual crop recommendation."""
    crop: str
    match_score: float  # 0-100
    expected_price: float  # ₹/quintal
    risk_level: str  # "Low", "Medium", "High"
    reasons: List[str]
    season: str


class RecommendationRequest(BaseModel):
    """Schema for recommendation request."""
    farm_id: int
    season: Optional[str] = None  # Auto-detect if not provided


class RecommendationResponse(BaseModel):
    """Schema for recommendation response."""
    farm_id: int
    farm_name: str
    weather_summary: WeatherData
    current_season: str
    recommendations: List[CropRecommendation]


class RiskAssessment(BaseModel):
    """Schema for risk assessment."""
    overall_level: str  # "Low", "Medium", "High"
    risk_factors: List[str]
    climate_risk: str
    market_risk: str
