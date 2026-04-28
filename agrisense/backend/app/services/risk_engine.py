from typing import Tuple, List


def calculate_risk(
    expected_rainfall_mm: float,
    crop_max_rainfall_mm: float,
    crop_min_rainfall_mm: float,
    market_volatility: str,
    current_temp: float,
    crop_min_temp: float,
    crop_max_temp: float,
    avg_temp_7day: float
) -> Tuple[str, List[str]]:
    """
    Calculate climate and market risk for a crop-farm combination.

    Returns:
        (risk_level, reasons_list)
        risk_level: "Low" | "Medium" | "High"
        reasons_list: human-readable explanation strings
    """
    risk_score = 0
    reasons = []

    # --- RAINFALL RISK ---
    if expected_rainfall_mm > crop_max_rainfall_mm * 1.2:
        risk_score += 3
        reasons.append(
            f"Flood risk: Expected {expected_rainfall_mm:.0f}mm far exceeds crop maximum of {crop_max_rainfall_mm:.0f}mm."
        )
    elif expected_rainfall_mm > crop_max_rainfall_mm:
        risk_score += 2
        reasons.append(
            f"Excess rainfall expected ({expected_rainfall_mm:.0f}mm vs {crop_max_rainfall_mm:.0f}mm max). Waterlogging possible."
        )
    elif expected_rainfall_mm < crop_min_rainfall_mm * 0.7:
        risk_score += 3
        reasons.append(
            f"Drought risk: Only {expected_rainfall_mm:.0f}mm expected, far below minimum {crop_min_rainfall_mm:.0f}mm."
        )
    elif expected_rainfall_mm < crop_min_rainfall_mm:
        risk_score += 1
        reasons.append(
            f"Rainfall slightly below ideal range ({expected_rainfall_mm:.0f}mm vs {crop_min_rainfall_mm:.0f}mm min). Irrigation may be required."
        )
    else:
        reasons.append(
            f"Rainfall forecast ({expected_rainfall_mm:.0f}mm) is within optimal range for this crop."
        )

    # --- TEMPERATURE RISK ---
    if avg_temp_7day > crop_max_temp + 3:
        risk_score += 2
        reasons.append(
            f"Heat stress risk: 7-day average {avg_temp_7day:.1f}°C exceeds crop maximum {crop_max_temp}°C."
        )
    elif avg_temp_7day < crop_min_temp - 3:
        risk_score += 2
        reasons.append(
            f"Cold stress risk: 7-day average {avg_temp_7day:.1f}°C below crop minimum {crop_min_temp}°C."
        )
    elif avg_temp_7day > crop_max_temp:
        risk_score += 1
        reasons.append(
            f"Temperature slightly above optimal range ({avg_temp_7day:.1f}°C vs max {crop_max_temp}°C). Monitor crop stress."
        )
    elif avg_temp_7day < crop_min_temp:
        risk_score += 1
        reasons.append(
            f"Temperature slightly below optimal range ({avg_temp_7day:.1f}°C vs min {crop_min_temp}°C). Consider protective measures."
        )
    else:
        reasons.append(
            f"Temperature range ({avg_temp_7day:.1f}°C) is suitable for this crop."
        )

    # --- MARKET RISK ---
    if market_volatility == "High":
        risk_score += 2
        reasons.append(
            "Market price for this crop is historically highly volatile. Consider fixed-price contracts or futures."
        )
    elif market_volatility == "Medium":
        risk_score += 1
        reasons.append(
            "Moderate price fluctuations expected. Monitor mandi rates weekly."
        )
    else:
        reasons.append(
            "Market price for this crop is relatively stable. Good time to plan production."
        )

    # --- DETERMINE RISK LEVEL ---
    if risk_score >= 3:
        risk_level = "High"
    elif risk_score >= 1:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return risk_level, reasons


def calculate_match_score(
    soil_type_farm: str,
    soil_types_crop: str,
    temp_match: bool,
    rainfall_match: bool,
    season_current: str,
    season_crop: str
) -> float:
    """
    Calculate a 0-100 match score for a crop-farm pairing.

    Scoring:
        Soil compatibility: 30 points
        Temperature match:  25 points
        Rainfall match:     25 points
        Season match:       20 points
    """
    score = 0.0

    # Soil compatibility (30 points)
    compatible_soils = [s.strip().lower() for s in soil_types_crop.split(",")]
    if soil_type_farm.lower() in compatible_soils:
        score += 30

    # Temperature match (25 points)
    if temp_match:
        score += 25

    # Rainfall match (25 points)
    if rainfall_match:
        score += 25

    # Season match (20 points)
    crop_seasons = [s.strip().lower() for s in season_crop.split(",")]
    if season_current.lower() in crop_seasons:
        score += 20
    elif "zaid" in crop_seasons:
        score += 10  # Year-round crop gets partial credit

    return min(score, 100.0)


def get_market_volatility(price_history: list) -> str:
    """
    Determine market volatility from a list of historical prices.

    Returns: "Low" | "Medium" | "High"
    """
    if not price_history or len(price_history) < 2:
        return "Medium"

    import statistics
    mean_price = statistics.mean(price_history)
    if mean_price == 0:
        return "Medium"

    std_dev = statistics.stdev(price_history)
    cv = (std_dev / mean_price) * 100  # Coefficient of variation

    if cv > 20:
        return "High"
    elif cv > 10:
        return "Medium"
    else:
        return "Low"
