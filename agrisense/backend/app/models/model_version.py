from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base


class ModelVersion(Base):
    """Model version tracking for ML models."""
    
    __tablename__ = "model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String(50), nullable=False, index=True)  # 'crop_recommendation', 'price_prediction'
    version = Column(String(50), nullable=False)
    file_path = Column(String(255), nullable=False)
    accuracy = Column(Float, nullable=True)  # 0.0 to 1.0
    metrics = Column(JSONB, nullable=True)  # Additional metrics: precision, recall, MAPE, etc.
    trained_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=False, index=True)
    
    def __repr__(self):
        return f"<ModelVersion(type='{self.model_type}', version='{self.version}', active={self.is_active})>"
