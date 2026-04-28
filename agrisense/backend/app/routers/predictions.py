import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.market_data import MarketData
from app.models.recommendation import Recommendation
from app.services.auth_service import get_current_user
from app.services.weather_service import get_weather_safe
from app.services.ml_service import predict_top_crops
from app.services.risk_engine import calculate_risk, calculate_match_score, get_market_volatility
from app.services.market_service import get_latest_price, get_price_history

logger = logging.getLogger(__name__)
router = APIRouter()

MODEL_VERSION = "1.0.0"


def get_current_season(month: int) -> str:
    if month in [6, 7, 8, 9]:
        return "Kharif"
    elif month in [10, 11, 12, 1, 2, 3]:
        return "Rabi"
    else:
        return "Zaid"


@router.get("/crop/{farm_id}")
async def predict_crop(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI-powered crop recommendations for a farm.
    Returns top 5 crops with match scores, expected prices, and risk levels.
    """
    # 1. Fetch farm (verify ownership)
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.user_id == current_user.id
    ).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    # 2. Get weather data (with caching + fallback)
    weather = await get_weather_safe(str(farm.id), farm.latitude, farm.longitude)

    # 3. Determine current season
    current_month = datetime.utcnow().month
    current_season = get_current_season(current_month)

    # 4. Get ML predictions
    ml_results = predict_top_crops(
        temperature=weather["current_temp"],
        humidity=weather["current_humidity"],
        rainfall_mm=weather["weekly_rainfall_forecast_mm"],
        ph_level=6.5,
        soil_type=farm.soil_type or "Loamy",
        state=farm.state,
        month=current_month
    )

    # 5. Enrich with crop reference data, market prices, and risk
    recommendations = []
    for ml_result in ml_results:
        crop_name = ml_result["crop_name"]

        # Fetch crop reference data
        crop_ref = db.query(Crop).filter(Crop.name == crop_name).first()

        # Fetch latest market price
        market_price = get_latest_price(db, crop_name, farm.state)
        price_history_data = get_price_history(db, crop_name, farm.state, days=30)
        historical_prices = [r["modal_price"] for r in price_history_data]
        market_volatility = get_market_volatility(historical_prices)

        actual_price = (
            market_price["modal_price"] if market_price
            else ml_result["predicted_price"]
        )

        # Run risk engine
        if crop_ref:
            temp_match = crop_ref.temp_min <= weather["avg_temp_7day"] <= crop_ref.temp_max
            rainfall_match = crop_ref.rainfall_min <= weather["weekly_rainfall_forecast_mm"] <= crop_ref.rainfall_max

            risk_level, risk_reasons = calculate_risk(
                expected_rainfall_mm=weather["weekly_rainfall_forecast_mm"],
                crop_max_rainfall_mm=crop_ref.rainfall_max,
                crop_min_rainfall_mm=crop_ref.rainfall_min,
                market_volatility=market_volatility,
                current_temp=weather["current_temp"],
                crop_min_temp=crop_ref.temp_min,
                crop_max_temp=crop_ref.temp_max,
                avg_temp_7day=weather["avg_temp_7day"]
            )

            match_score = calculate_match_score(
                soil_type_farm=farm.soil_type or "Loamy",
                soil_types_crop=crop_ref.suitable_soils,
                temp_match=temp_match,
                rainfall_match=rainfall_match,
                season_current=current_season,
                season_crop=crop_ref.seasons
            )

            crop_season = crop_ref.seasons
        else:
            risk_level = "Medium"
            risk_reasons = ["Insufficient crop reference data for detailed risk analysis."]
            match_score = ml_result["match_score"]
            crop_season = current_season

        recommendations.append({
            "crop": crop_name,
            "match_score": round(match_score, 1),
            "expected_price": round(actual_price, 2),
            "risk_level": risk_level,
            "reasons": risk_reasons,
            "season": crop_season
        })

    # 6. Sort by match_score descending
    recommendations.sort(key=lambda x: x["match_score"], reverse=True)

    # 7. Log recommendation to DB
    try:
        log = Recommendation(
            user_id=current_user.id,
            farm_id=farm_id,
            season=current_season,
            crops_data=recommendations,
            model_version=MODEL_VERSION
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log recommendation: {e}")
        db.rollback()

    return {
        "farm_id": farm_id,
        "farm_name": farm.name,
        "weather_summary": weather,
        "current_season": current_season,
        "recommendations": recommendations
    }


@router.get("/history/{farm_id}")
async def prediction_history(
    farm_id: int,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated recommendation history for a farm.
    """
    # Verify farm ownership
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.user_id == current_user.id
    ).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    offset = (page - 1) * limit
    total = db.query(Recommendation).filter(Recommendation.farm_id == farm_id).count()
    records = (
        db.query(Recommendation)
        .filter(Recommendation.farm_id == farm_id)
        .order_by(Recommendation.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "farm_id": farm_id,
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": r.id,
                "season": r.season,
                "crops_data": r.crops_data,
                "model_version": r.model_version,
                "created_at": r.created_at.isoformat()
            }
            for r in records
        ]
    }
