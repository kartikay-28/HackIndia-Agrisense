from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import httpx

from app.config import settings
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter()

SYSTEM_PROMPT = """You are AgriSense AI Advisor, an expert agricultural assistant for Indian farmers.
You have deep knowledge of:
- Indian crops: Rice, Wheat, Cotton, Sugarcane, Maize, Soybean, Groundnut, Mustard, Turmeric, Chilli
- Indian agricultural seasons: Kharif (June-Nov), Rabi (Nov-Apr), Zaid (Apr-Jun)
- AGMARKNET mandi prices and market trends across 3000+ mandis
- Indian states and their agricultural profiles (Punjab, Maharashtra, UP, etc.)
- Climate risks, irrigation schedules, fertilizer recommendations
- Government schemes: MSP, PM-KISAN, Pradhan Mantri Fasal Bima Yojana
- Soil types: Alluvial, Black, Red, Laterite, Desert

Always give practical, actionable advice. Use ₹ for prices. Be concise but helpful.
If asked about current prices, give realistic estimates based on typical AGMARKNET data.
Respond in the same language the user writes in (Hindi or English)."""


class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    reply: str
    model: str


@router.post("/chat", response_model=ChatResponse)
async def advisor_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    AI Advisor chat endpoint powered by Groq (llama3-8b-8192).
    All messages are sent to Groq API with agricultural system context.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Groq API key not configured. Add GROQ_API_KEY to backend .env"
        )

    groq_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in request.messages:
        if msg.role in ("user", "assistant"):
            groq_messages.append({"role": msg.role, "content": msg.content})

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama3-8b-8192",
                "messages": groq_messages,
                "max_tokens": 512,
                "temperature": 0.7,
            }
        )

    if response.status_code != 200:
        error_detail = response.json().get("error", {}).get("message", f"HTTP {response.status_code}")
        raise HTTPException(status_code=502, detail=f"Groq API error: {error_detail}")

    data = response.json()
    reply = data["choices"][0]["message"]["content"]
    model = data.get("model", "llama3-8b-8192")

    return ChatResponse(reply=reply, model=model)
