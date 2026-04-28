from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Crop(Base):
    """Crop reference data model with climate requirements."""
    
    __tablename__ = "crops"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    temp_min = Column(Float, nullable=False)
    temp_max = Column(Float, nullable=False)
    rainfall_min = Column(Float, nullable=False)  # mm/year
    rainfall_max = Column(Float, nullable=False)
    humidity_min = Column(Float, nullable=False)  # percentage
    humidity_max = Column(Float, nullable=False)
    suitable_soils = Column(Text, nullable=False)  # Comma-separated
    seasons = Column(Text, nullable=False)  # Comma-separated: Kharif, Rabi, Zaid
    states = Column(Text, nullable=False)  # Comma-separated state names
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Crop(id={self.id}, name='{self.name}')>"
    
    @property
    def suitable_soils_list(self) -> list[str]:
        """Get suitable soils as a list."""
        return [s.strip() for s in self.suitable_soils.split(',')]
    
    @property
    def seasons_list(self) -> list[str]:
        """Get seasons as a list."""
        return [s.strip() for s in self.seasons.split(',')]
    
    @property
    def states_list(self) -> list[str]:
        """Get states as a list."""
        return [s.strip() for s in self.states.split(',')]
