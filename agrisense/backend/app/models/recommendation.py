from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Recommendation(Base):
    """Recommendation log model for storing crop recommendations."""
    
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    season = Column(String(20), nullable=False)
    crops_data = Column(JSONB, nullable=False)  # Array of {crop, match_score, price, risk}
    model_version = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="recommendations")
    farm = relationship("Farm", back_populates="recommendations")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("season IN ('Kharif', 'Rabi', 'Zaid')", name='valid_season'),
    )
    
    def __repr__(self):
        return f"<Recommendation(id={self.id}, farm_id={self.farm_id}, season='{self.season}')>"
