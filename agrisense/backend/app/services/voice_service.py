import io
import base64
import tempfile
import os
import logging
import speech_recognition as sr
from gtts import gTTS

logger = logging.getLogger(__name__)


def _translate(text: str, source: str = "hi", target: str = "en") -> str:
    """
    Translate text using deep-translator (GoogleTranslator).
    Falls back to returning original text if translation fails.
    """
    try:
        from deep_translator import GoogleTranslator
        return GoogleTranslator(source=source, target=target).translate(text)
    except Exception as e:
        logger.warning(f"Translation failed ({source}->{target}): {e}")
        return text


def transcribe_audio(audio_bytes: bytes) -> str:
    """Convert audio bytes to text using Google Speech Recognition."""
    recognizer = sr.Recognizer()

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with sr.AudioFile(tmp_path) as source:
            audio = recognizer.record(source)

        # Try Hindi first, fallback to English
        try:
            text = recognizer.recognize_google(audio, language="hi-IN")
            logger.info(f"Transcribed (Hindi): {text}")
            return text
        except sr.UnknownValueError:
            text = recognizer.recognize_google(audio, language="en-IN")
            logger.info(f"Transcribed (English fallback): {text}")
            return text

    except sr.RequestError as e:
        raise RuntimeError(f"Speech recognition service error: {e}")
    finally:
        os.unlink(tmp_path)


def translate_to_english(text: str) -> str:
    """Translate Hindi text to English."""
    return _translate(text, source="hi", target="en")


def parse_intent(english_text: str) -> dict:
    """
    Parse the farmer's intent from translated English text.
    Returns { intent, crop, state }
    """
    text_lower = english_text.lower()

    crops = [
        "rice", "wheat", "cotton", "sugarcane", "maize",
        "soybean", "groundnut", "mustard", "turmeric", "chilli"
    ]
    detected_crop = next((c for c in crops if c in text_lower), None)

    states = [
        "punjab", "haryana", "uttar pradesh", "bihar", "west bengal",
        "andhra pradesh", "telangana", "karnataka", "tamil nadu", "kerala",
        "maharashtra", "gujarat", "madhya pradesh", "rajasthan", "odisha"
    ]
    detected_state = next((s for s in states if s in text_lower), None)

    intent = "unknown"
    if any(w in text_lower for w in ["price", "rate", "cost", "daam", "bhav", "keemat"]):
        intent = "price_query"
    elif any(w in text_lower for w in ["weather", "rain", "mausam", "barish", "temperature"]):
        intent = "weather_query"
    elif any(w in text_lower for w in ["recommend", "grow", "plant", "ugaao", "fasal", "crop", "suggest"]):
        intent = "recommendation_query"
    elif any(w in text_lower for w in ["risk", "danger", "khatara"]):
        intent = "risk_query"

    return {"intent": intent, "crop": detected_crop, "state": detected_state}


def text_to_hindi_speech(text: str) -> bytes:
    """Convert English text response to Hindi audio bytes (MP3)."""
    # Translate to Hindi
    hindi_text = _translate(text, source="en", target="hi")

    tts = gTTS(text=hindi_text, lang="hi", slow=False)
    buffer = io.BytesIO()
    tts.write_to_fp(buffer)
    buffer.seek(0)
    return buffer.read()


def audio_to_base64(audio_bytes: bytes) -> str:
    """Encode audio bytes to base64 string."""
    return base64.b64encode(audio_bytes).decode("utf-8")
