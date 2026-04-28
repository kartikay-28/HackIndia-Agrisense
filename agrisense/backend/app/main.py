import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import create_tables
from app.routers import auth, farms, predictions, market, voice
from app.services.ml_service import load_models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AgriSense API",
    description="AI-Powered Agricultural Intelligence Platform for Indian Farmers",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS — must be added BEFORE any other middleware or routes
# allow_origins=["*"] ensures CORS headers are present even on error responses
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router,        prefix="/api/auth",    tags=["Authentication"])
app.include_router(farms.router,       prefix="/api/farms",   tags=["Farms"])
app.include_router(predictions.router, prefix="/api/predict", tags=["Predictions"])
app.include_router(market.router,      prefix="/api/market",  tags=["Market"])
app.include_router(voice.router,       prefix="/api/voice",   tags=["Voice"])


@app.on_event("startup")
async def startup_event():
    create_tables()
    logger.info("Database tables ready")
    load_models()
    logger.info("AgriSense API started")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("AgriSense API shutting down")


@app.get("/")
async def root():
    return {"message": "Welcome to AgriSense API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "AgriSense API"}
