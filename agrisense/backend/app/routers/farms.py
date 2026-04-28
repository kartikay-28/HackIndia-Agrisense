from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse
from app.services.auth_service import get_current_user
from app.services.soil_detection_service import SoilDetectionService

router = APIRouter()


@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(
    farm_data: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new farm with automatic soil type detection.
    
    - **name**: Farm name
    - **latitude**: GPS latitude (-90 to 90)
    - **longitude**: GPS longitude (-180 to 180)
    - **state**: Indian state name
    - **area_acres**: Farm area in acres (optional)
    """
    # Detect soil type from GPS coordinates
    soil_type, soil_confidence = SoilDetectionService.detect_soil_type(
        db, farm_data.latitude, farm_data.longitude
    )
    
    # Create new farm
    new_farm = Farm(
        user_id=current_user.id,
        name=farm_data.name,
        latitude=farm_data.latitude,
        longitude=farm_data.longitude,
        soil_type=soil_type,
        soil_confidence=soil_confidence,
        state=farm_data.state,
        area_acres=farm_data.area_acres
    )
    
    db.add(new_farm)
    db.commit()
    db.refresh(new_farm)
    
    return FarmResponse.from_orm(new_farm)


@router.get("", response_model=List[FarmResponse])
async def list_farms(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all farms for the current user.
    Returns farm count in X-Total-Count header.
    """
    farms = db.query(Farm).filter(Farm.user_id == current_user.id).all()
    
    # Add total count to response header
    response.headers["X-Total-Count"] = str(len(farms))
    
    return [FarmResponse.from_orm(farm) for farm in farms]


@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get details of a specific farm.
    
    - **farm_id**: Farm ID
    """
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.user_id == current_user.id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    return FarmResponse.from_orm(farm)


@router.put("/{farm_id}", response_model=FarmResponse)
async def update_farm(
    farm_id: int,
    farm_data: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update farm details.
    Re-detects soil type if GPS coordinates change.
    
    - **farm_id**: Farm ID
    """
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.user_id == current_user.id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    # Track if coordinates changed
    coordinates_changed = False
    
    # Update fields
    if farm_data.name is not None:
        farm.name = farm_data.name
    
    if farm_data.latitude is not None:
        farm.latitude = farm_data.latitude
        coordinates_changed = True
    
    if farm_data.longitude is not None:
        farm.longitude = farm_data.longitude
        coordinates_changed = True
    
    if farm_data.state is not None:
        farm.state = farm_data.state
    
    if farm_data.area_acres is not None:
        farm.area_acres = farm_data.area_acres
    
    # Re-detect soil type if coordinates changed
    if coordinates_changed:
        soil_type, soil_confidence = SoilDetectionService.detect_soil_type(
            db, farm.latitude, farm.longitude
        )
        farm.soil_type = soil_type
        farm.soil_confidence = soil_confidence
    
    db.commit()
    db.refresh(farm)
    
    return FarmResponse.from_orm(farm)


@router.delete("/{farm_id}", status_code=status.HTTP_200_OK)
async def delete_farm(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a farm and all associated recommendations.
    
    - **farm_id**: Farm ID
    """
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.user_id == current_user.id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    db.delete(farm)
    db.commit()
    
    return {"message": "Farm deleted successfully"}
