from sqlalchemy.orm import Session
from app.models.soil_map import SoilMap


class SoilDetectionService:
    """Service for detecting soil type from GPS coordinates."""
    
    @staticmethod
    def detect_soil_type(db: Session, latitude: float, longitude: float) -> tuple[str, float]:
        """
        Detect soil type from GPS coordinates using bounding box lookup.
        
        Args:
            db: Database session
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Tuple of (soil_type, confidence_score)
        """
        return SoilMap.get_soil_type(db, latitude, longitude)
    
    @staticmethod
    def get_soil_characteristics(soil_type: str) -> dict:
        """
        Get characteristics for a soil type.
        
        Args:
            soil_type: Type of soil
            
        Returns:
            Dictionary with soil characteristics
        """
        soil_characteristics = {
            "Alluvial": {
                "water_retention": "High",
                "nutrient_level": "High",
                "ph_range": "6.5-7.5",
                "suitable_crops": ["Rice", "Wheat", "Sugarcane", "Cotton", "Maize"]
            },
            "Black": {
                "water_retention": "Very High",
                "nutrient_level": "High",
                "ph_range": "7.0-8.5",
                "suitable_crops": ["Cotton", "Soybean", "Wheat", "Sugarcane", "Groundnut"]
            },
            "Red": {
                "water_retention": "Medium",
                "nutrient_level": "Medium",
                "ph_range": "5.5-7.0",
                "suitable_crops": ["Groundnut", "Maize", "Cotton", "Turmeric", "Chilli"]
            },
            "Laterite": {
                "water_retention": "Low",
                "nutrient_level": "Low",
                "ph_range": "5.0-6.5",
                "suitable_crops": ["Groundnut", "Turmeric", "Chilli"]
            },
            "Desert": {
                "water_retention": "Very Low",
                "nutrient_level": "Low",
                "ph_range": "7.5-8.5",
                "suitable_crops": ["Mustard", "Groundnut"]
            },
            "Loamy": {
                "water_retention": "Medium",
                "nutrient_level": "Medium",
                "ph_range": "6.0-7.5",
                "suitable_crops": ["Wheat", "Rice", "Maize", "Soybean", "Mustard"]
            }
        }
        
        return soil_characteristics.get(soil_type, {
            "water_retention": "Unknown",
            "nutrient_level": "Unknown",
            "ph_range": "Unknown",
            "suitable_crops": []
        })
