from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class FarmCreate(BaseModel):
    """Schema for creating a new farm."""
    name: str = Field(..., min_length=1, max_length=100)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    state: str = Field(..., min_length=1, max_length=50)
    area_acres: Optional[float] = Field(None, gt=0)


class FarmUpdate(BaseModel):
    """Schema for updating farm details."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    state: Optional[str] = Field(None, min_length=1, max_length=50)
    area_acres: Optional[float] = Field(None, gt=0)


class FarmResponse(BaseModel):
    """Schema for farm response."""
    id: int
    user_id: int
    name: str
    latitude: float
    longitude: float
    soil_type: Optional[str]
    soil_confidence: Optional[float]
    state: str
    area_acres: Optional[float]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
