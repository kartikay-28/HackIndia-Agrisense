from sqlalchemy import Column, Integer, String, Float, CheckConstraint
from sqlalchemy.orm import Session
from app.database import Base


class SoilMap(Base):
    """Soil map model for GPS-based soil type detection."""
    
    __tablename__ = "soil_map"
    
    id = Column(Integer, primary_key=True, index=True)
    region_name = Column(String(100), nullable=True)
    min_lat = Column(Float, nullable=False)
    max_lat = Column(Float, nullable=False)
    min_lon = Column(Float, nullable=False)
    max_lon = Column(Float, nullable=False)
    soil_type = Column(String(50), nullable=False)
    confidence = Column(Float, default=0.90)
    
    # Constraints
    __table_args__ = (
        CheckConstraint('min_lat < max_lat', name='valid_lat_range'),
        CheckConstraint('min_lon < max_lon', name='valid_lon_range'),
    )
    
    def __repr__(self):
        return f"<SoilMap(region='{self.region_name}', soil_type='{self.soil_type}')>"
    
    @classmethod
    def get_soil_type(cls, db: Session, latitude: float, longitude: float) -> tuple[str, float]:
        """
        Detect soil type from GPS coordinates using bounding box lookup.
        
        Args:
            db: Database session
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Tuple of (soil_type, confidence)
        """
        result = db.query(cls).filter(
            cls.min_lat <= latitude,
            cls.max_lat >= latitude,
            cls.min_lon <= longitude,
            cls.max_lon >= longitude
        ).first()
        
        if result:
            return result.soil_type, result.confidence
        else:
            # Default to Loamy with low confidence
            return "Loamy", 0.5
