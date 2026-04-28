from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Farm(Base):
    """Farm model for storing farm locations and details."""
    
    __tablename__ = "farms"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    soil_type = Column(String(50), nullable=True)
    soil_confidence = Column(Float, nullable=True)
    state = Column(String(50), nullable=False, index=True)
    area_acres = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="farms")
    recommendations = relationship("Recommendation", back_populates="farm", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('latitude >= -90 AND latitude <= 90', name='valid_latitude'),
        CheckConstraint('longitude >= -180 AND longitude <= 180', name='valid_longitude'),
        CheckConstraint('soil_confidence >= 0 AND soil_confidence <= 1', name='valid_confidence'),
    )
    
    def __repr__(self):
        return f"<Farm(id={self.id}, name='{self.name}', state='{self.state}')>"
