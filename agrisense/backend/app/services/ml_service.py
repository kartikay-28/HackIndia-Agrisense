import pickle
import logging
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent / "ml_models"

SOIL_ENCODING = {
    "Alluvial": 0, "Black": 1, "Red": 2, "Laterite": 3, "Desert": 4, "Loamy": 2
}

STATE_ENCODING = {
    "Punjab": 0, "Haryana": 1, "Uttar Pradesh": 2, "Bihar": 3, "West Bengal": 4,
    "Andhra Pradesh": 5, "Telangana": 6, "Karnataka": 7, "Tamil Nadu": 8, "Kerala": 9,
    "Maharashtra": 10, "Gujarat": 11, "Madhya Pradesh": 12, "Rajasthan": 13,
    "Odisha": 14, "Jharkhand": 15, "Chhattisgarh": 16, "Assam": 17,
    "Himachal Pradesh": 18, "Uttarakhand": 19, "Jammu and Kashmir": 20,
    "Delhi": 21, "Goa": 22, "Manipur": 23, "Meghalaya": 24,
    "Nagaland": 25, "Mizoram": 26, "Tripura": 27, "Sikkim": 28
}

# Module-level model cache
_crop_model = None
_price_model = None
_label_encoder = None
_models_loaded = False


def load_models():
    """Load ML models from disk. Called once at startup."""
    global _crop_model, _price_model, _label_encoder, _models_loaded

    try:
        with open(MODEL_DIR / "crop_model.pkl", "rb") as f:
            _crop_model = pickle.load(f)
        with open(MODEL_DIR / "price_model.pkl", "rb") as f:
            _price_model = pickle.load(f)
        with open(MODEL_DIR / "label_encoder.pkl", "rb") as f:
            _label_encoder = pickle.load(f)
        _models_loaded = True
        logger.info("✅ ML models loaded successfully")
    except FileNotFoundError:
        logger.warning("⚠️  ML model files not found. Run scripts/train_models.py first.")
        _models_loaded = False


def _get_fallback_recommendations(top_n: int = 5) -> list[dict]:
    """Return static fallback recommendations when models are not loaded."""
    fallback = [
        {"crop_name": "Wheat",     "match_score": 75.0, "predicted_price": 2500.0},
        {"crop_name": "Rice",      "match_score": 70.0, "predicted_price": 2000.0},
        {"crop_name": "Maize",     "match_score": 65.0, "predicted_price": 1800.0},
        {"crop_name": "Mustard",   "match_score": 60.0, "predicted_price": 5500.0},
        {"crop_name": "Soybean",   "match_score": 55.0, "predicted_price": 4000.0},
    ]
    return fallback[:top_n]


def predict_top_crops(
    temperature: float,
    humidity: float,
    rainfall_mm: float,
    ph_level: float,
    soil_type: str,
    state: str,
    month: int,
    top_n: int = 5
) -> list[dict]:
    """
    Returns top N crop recommendations with ML confidence scores.
    Each item: { crop_name, match_score, predicted_price }
    Falls back to static defaults if models are not loaded.
    """
    if not _models_loaded:
        logger.warning("Models not loaded — returning fallback recommendations")
        return _get_fallback_recommendations(top_n)

    soil_enc = SOIL_ENCODING.get(soil_type, 2)
    state_enc = STATE_ENCODING.get(state, 0)

    feature_vector = np.array([[
        temperature, humidity, rainfall_mm, ph_level,
        soil_enc, state_enc, month
    ]])

    # Get class probabilities from RandomForest
    probabilities = _crop_model.predict_proba(feature_vector)[0]

    # Get top N crops by probability
    top_indices = np.argsort(probabilities)[::-1][:top_n]

    results = []
    for idx in top_indices:
        crop_name = _label_encoder.get(int(idx), f"Crop_{idx}")
        match_score = round(float(probabilities[idx]) * 100, 2)

        # Predict price for this crop + conditions
        predicted_price = float(_price_model.predict(feature_vector)[0])
        predicted_price = round(max(500.0, predicted_price), 2)

        results.append({
            "crop_name": crop_name,
            "match_score": match_score,
            "predicted_price": predicted_price
        })

    return results
