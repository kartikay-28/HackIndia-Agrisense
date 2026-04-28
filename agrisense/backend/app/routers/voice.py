from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.voice_service import (
    transcribe_audio,
    translate_to_english,
    parse_intent,
    text_to_hindi_speech,
    audio_to_base64
)
from app.services.market_service import get_latest_price
from app.services.weather_service import get_weather_safe
from app.models.farm import Farm

router = APIRouter()


@router.post("/query")
async def voice_query(
    audio: UploadFile = File(...),
    farm_id: int = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process a voice query in Hindi.
    Returns transcription, translation, intent, response text, and Hindi audio.
    """
    # Read audio file
    audio_bytes = await audio.read()

    try:
        # 1. Transcribe audio to text
        hindi_text = transcribe_audio(audio_bytes)

        # 2. Translate to English
        english_text = translate_to_english(hindi_text)

        # 3. Parse intent
        intent_data = parse_intent(english_text)
        intent = intent_data["intent"]
        crop = intent_data.get("crop")
        state = intent_data.get("state")

        # 4. Generate response based on intent
        response_text = ""

        if intent == "price_query":
            if not crop or not state:
                response_text = "Please specify both crop and state for price information."
            else:
                price_data = get_latest_price(db, crop.capitalize(), state.capitalize())
                if price_data:
                    response_text = (
                        f"The latest price for {crop} in {state} is "
                        f"₹{price_data['modal_price']:.2f} per quintal. "
                        f"Range: ₹{price_data['min_price']:.2f} to ₹{price_data['max_price']:.2f}."
                    )
                else:
                    response_text = f"Sorry, no price data available for {crop} in {state}."

        elif intent == "weather_query":
            if farm_id:
                farm = db.query(Farm).filter(
                    Farm.id == farm_id,
                    Farm.user_id == current_user.id
                ).first()
                if farm:
                    weather = await get_weather_safe(str(farm.id), farm.latitude, farm.longitude)
                    response_text = (
                        f"Current weather at your farm: {weather['weather_description']}. "
                        f"Temperature: {weather['current_temp']:.1f}°C. "
                        f"Humidity: {weather['current_humidity']:.0f}%. "
                        f"Expected rainfall this week: {weather['weekly_rainfall_forecast_mm']:.0f}mm."
                    )
                else:
                    response_text = "Farm not found."
            else:
                response_text = "Please specify a farm ID for weather information."

        elif intent == "recommendation_query":
            response_text = (
                "To get crop recommendations, please use the prediction feature in the app. "
                "It will analyze your farm's soil, weather, and market conditions."
            )

        elif intent == "risk_query":
            response_text = (
                "Risk assessment is available in the crop recommendation results. "
                "Check the app for detailed climate and market risk analysis."
            )

        else:
            response_text = (
                "I can help you with crop prices, weather information, and recommendations. "
                "Please ask about prices, weather, or crop suggestions."
            )

        # 5. Convert response to Hindi audio
        audio_response = text_to_hindi_speech(response_text)
        audio_base64 = audio_to_base64(audio_response)

        return {
            "transcription": hindi_text,
            "translation": english_text,
            "intent": intent,
            "response_text": response_text,
            "audio_base64": audio_base64
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice processing error: {str(e)}")
