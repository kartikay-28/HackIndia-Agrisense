"""
Database seeding script for AgriSense.
Seeds crop reference data, soil map, and sample market data.
"""
import sys
import os
import random
from pathlib import Path
from datetime import date, timedelta

# ── Resolve paths ──────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent   # .../backend/scripts
BACKEND_DIR = SCRIPT_DIR.parent                # .../backend

# Add backend dir to sys.path so `app.*` imports work
sys.path.insert(0, str(BACKEND_DIR))

# Change cwd to backend so python-dotenv finds .env
os.chdir(BACKEND_DIR)

from app.database import SessionLocal, create_tables
from app.models.crop import Crop
from app.models.soil_map import SoilMap
from app.models.market_data import MarketData


def seed_crops(db):
    """Seed crop reference data."""
    print("Seeding crops...")
    
    crops_data = [
        {
            "name": "Rice",
            "temp_min": 20.0,
            "temp_max": 35.0,
            "rainfall_min": 1000.0,
            "rainfall_max": 2500.0,
            "humidity_min": 60.0,
            "humidity_max": 80.0,
            "suitable_soils": "Alluvial,Black",
            "seasons": "Kharif",
            "states": "Punjab,Haryana,Uttar Pradesh,West Bengal,Andhra Pradesh,Tamil Nadu,Bihar,Odisha"
        },
        {
            "name": "Wheat",
            "temp_min": 10.0,
            "temp_max": 25.0,
            "rainfall_min": 500.0,
            "rainfall_max": 1000.0,
            "humidity_min": 50.0,
            "humidity_max": 70.0,
            "suitable_soils": "Alluvial,Black,Loamy",
            "seasons": "Rabi",
            "states": "Punjab,Haryana,Uttar Pradesh,Madhya Pradesh,Rajasthan,Bihar,Gujarat"
        },
        {
            "name": "Cotton",
            "temp_min": 21.0,
            "temp_max": 30.0,
            "rainfall_min": 500.0,
            "rainfall_max": 1000.0,
            "humidity_min": 50.0,
            "humidity_max": 80.0,
            "suitable_soils": "Black,Alluvial",
            "seasons": "Kharif",
            "states": "Gujarat,Maharashtra,Andhra Pradesh,Telangana,Punjab,Haryana"
        },
        {
            "name": "Sugarcane",
            "temp_min": 20.0,
            "temp_max": 35.0,
            "rainfall_min": 1000.0,
            "rainfall_max": 1500.0,
            "humidity_min": 60.0,
            "humidity_max": 80.0,
            "suitable_soils": "Alluvial,Black,Red",
            "seasons": "Kharif,Rabi",
            "states": "Uttar Pradesh,Maharashtra,Karnataka,Tamil Nadu,Andhra Pradesh,Bihar,Punjab"
        },
        {
            "name": "Maize",
            "temp_min": 18.0,
            "temp_max": 32.0,
            "rainfall_min": 500.0,
            "rainfall_max": 1000.0,
            "humidity_min": 50.0,
            "humidity_max": 70.0,
            "suitable_soils": "Alluvial,Red,Black",
            "seasons": "Kharif,Rabi",
            "states": "Karnataka,Andhra Pradesh,Rajasthan,Madhya Pradesh,Bihar,Uttar Pradesh,Maharashtra"
        },
        {
            "name": "Soybean",
            "temp_min": 20.0,
            "temp_max": 30.0,
            "rainfall_min": 500.0,
            "rainfall_max": 900.0,
            "humidity_min": 60.0,
            "humidity_max": 80.0,
            "suitable_soils": "Black,Red,Alluvial",
            "seasons": "Kharif",
            "states": "Madhya Pradesh,Maharashtra,Rajasthan,Karnataka,Telangana"
        },
        {
            "name": "Groundnut",
            "temp_min": 20.0,
            "temp_max": 30.0,
            "rainfall_min": 500.0,
            "rainfall_max": 750.0,
            "humidity_min": 50.0,
            "humidity_max": 70.0,
            "suitable_soils": "Red,Black,Alluvial",
            "seasons": "Kharif,Rabi",
            "states": "Gujarat,Andhra Pradesh,Tamil Nadu,Karnataka,Rajasthan,Maharashtra"
        },
        {
            "name": "Mustard",
            "temp_min": 10.0,
            "temp_max": 25.0,
            "rainfall_min": 250.0,
            "rainfall_max": 500.0,
            "humidity_min": 50.0,
            "humidity_max": 70.0,
            "suitable_soils": "Alluvial,Loamy",
            "seasons": "Rabi",
            "states": "Rajasthan,Uttar Pradesh,Haryana,Madhya Pradesh,Gujarat,West Bengal"
        },
        {
            "name": "Turmeric",
            "temp_min": 20.0,
            "temp_max": 35.0,
            "rainfall_min": 1500.0,
            "rainfall_max": 2250.0,
            "humidity_min": 60.0,
            "humidity_max": 90.0,
            "suitable_soils": "Red,Black,Alluvial",
            "seasons": "Kharif",
            "states": "Andhra Pradesh,Telangana,Tamil Nadu,Maharashtra,Odisha,Karnataka"
        },
        {
            "name": "Chilli",
            "temp_min": 20.0,
            "temp_max": 35.0,
            "rainfall_min": 600.0,
            "rainfall_max": 1250.0,
            "humidity_min": 60.0,
            "humidity_max": 80.0,
            "suitable_soils": "Red,Black,Alluvial",
            "seasons": "Kharif,Rabi",
            "states": "Andhra Pradesh,Telangana,Karnataka,Maharashtra,Tamil Nadu,Odisha"
        }
    ]
    
    for crop_data in crops_data:
        existing = db.query(Crop).filter(Crop.name == crop_data["name"]).first()
        if not existing:
            crop = Crop(**crop_data)
            db.add(crop)
    
    db.commit()
    print(f"✅ Seeded {len(crops_data)} crops")


def seed_soil_map(db):
    """Seed soil map with bounding boxes for major Indian regions."""
    print("Seeding soil map...")
    
    soil_regions = [
        {
            "region_name": "Indo-Gangetic Plain",
            "min_lat": 24.0,
            "max_lat": 32.0,
            "min_lon": 72.0,
            "max_lon": 88.0,
            "soil_type": "Alluvial",
            "confidence": 0.95
        },
        {
            "region_name": "Deccan Plateau - Maharashtra",
            "min_lat": 15.0,
            "max_lat": 22.0,
            "min_lon": 73.0,
            "max_lon": 80.0,
            "soil_type": "Black",
            "confidence": 0.90
        },
        {
            "region_name": "Deccan Plateau - Karnataka",
            "min_lat": 12.0,
            "max_lat": 18.0,
            "min_lon": 74.0,
            "max_lon": 78.0,
            "soil_type": "Red",
            "confidence": 0.85
        },
        {
            "region_name": "Eastern Ghats",
            "min_lat": 11.0,
            "max_lat": 22.0,
            "min_lon": 78.0,
            "max_lon": 87.0,
            "soil_type": "Red",
            "confidence": 0.85
        },
        {
            "region_name": "Western Ghats - Kerala",
            "min_lat": 8.0,
            "max_lat": 13.0,
            "min_lon": 74.0,
            "max_lon": 77.0,
            "soil_type": "Laterite",
            "confidence": 0.85
        },
        {
            "region_name": "Western Ghats - Goa/Karnataka",
            "min_lat": 13.0,
            "max_lat": 16.0,
            "min_lon": 73.0,
            "max_lon": 76.0,
            "soil_type": "Laterite",
            "confidence": 0.85
        },
        {
            "region_name": "Thar Desert",
            "min_lat": 24.0,
            "max_lat": 30.0,
            "min_lon": 69.0,
            "max_lon": 75.0,
            "soil_type": "Desert",
            "confidence": 0.90
        },
        {
            "region_name": "Punjab Plains",
            "min_lat": 29.0,
            "max_lat": 32.5,
            "min_lon": 73.5,
            "max_lon": 76.5,
            "soil_type": "Alluvial",
            "confidence": 0.95
        },
        {
            "region_name": "Haryana Plains",
            "min_lat": 27.5,
            "max_lat": 30.5,
            "min_lon": 74.5,
            "max_lon": 77.5,
            "soil_type": "Alluvial",
            "confidence": 0.95
        },
        {
            "region_name": "Uttar Pradesh Plains",
            "min_lat": 24.0,
            "max_lat": 30.5,
            "min_lon": 77.0,
            "max_lon": 84.0,
            "soil_type": "Alluvial",
            "confidence": 0.95
        },
        {
            "region_name": "Bihar Plains",
            "min_lat": 24.0,
            "max_lat": 27.5,
            "min_lon": 83.5,
            "max_lon": 88.0,
            "soil_type": "Alluvial",
            "confidence": 0.95
        },
        {
            "region_name": "West Bengal Plains",
            "min_lat": 21.5,
            "max_lat": 27.0,
            "min_lon": 85.5,
            "max_lon": 89.0,
            "soil_type": "Alluvial",
            "confidence": 0.95
        },
        {
            "region_name": "Andhra Pradesh Coastal",
            "min_lat": 13.5,
            "max_lat": 19.0,
            "min_lon": 79.0,
            "max_lon": 84.5,
            "soil_type": "Alluvial",
            "confidence": 0.90
        },
        {
            "region_name": "Tamil Nadu Plains",
            "min_lat": 8.0,
            "max_lat": 13.5,
            "min_lon": 77.0,
            "max_lon": 80.5,
            "soil_type": "Red",
            "confidence": 0.85
        },
        {
            "region_name": "Gujarat Plains",
            "min_lat": 20.0,
            "max_lat": 24.5,
            "min_lon": 68.0,
            "max_lon": 74.0,
            "soil_type": "Black",
            "confidence": 0.88
        }
    ]
    
    for region_data in soil_regions:
        existing = db.query(SoilMap).filter(
            SoilMap.region_name == region_data["region_name"]
        ).first()
        if not existing:
            region = SoilMap(**region_data)
            db.add(region)
    
    db.commit()
    print(f"✅ Seeded {len(soil_regions)} soil map regions")


def seed_sample_market_data(db):
    """Seed sample market data for testing using bulk insert."""
    print("Seeding sample market data...")

    # All 10 crops with realistic base prices
    crops = ["Rice", "Wheat", "Cotton", "Maize", "Mustard", "Soybean",
             "Groundnut", "Sugarcane", "Turmeric", "Chilli"]
    states = ["Punjab", "Maharashtra", "Uttar Pradesh"]
    base_prices = {
        "Rice": 2100, "Wheat": 2500, "Cotton": 6200, "Maize": 1850,
        "Mustard": 5600, "Soybean": 4100, "Groundnut": 5200,
        "Sugarcane": 3100, "Turmeric": 8500, "Chilli": 7200
    }
    today = date.today()

    rows = []
    for crop in crops:
        for state in states:
            for days_ago in range(30):
                price_date = today - timedelta(days=days_ago)
                base = base_prices.get(crop, 2000)
                modal = round(base * random.uniform(0.9, 1.1), 2)
                rows.append({
                    "state": state,
                    "district": f"{state} District",
                    "market": f"{state} Mandi",
                    "commodity": crop,
                    "variety": "Common",
                    "grade": "A",
                    "min_price": round(modal * 0.95, 2),
                    "max_price": round(modal * 1.05, 2),
                    "modal_price": modal,
                    "arrival_date": price_date,
                    "source": "AGMARKNET"
                })

    # Bulk insert in one shot
    db.bulk_insert_mappings(MarketData, rows)
    db.commit()
    print(f"[OK] Seeded {len(rows)} market data records")
    print(f"[OK] Seeded {len(rows)} market data records")


def main():
    """Main seeding function."""
    print("🌱 Starting database seeding...")
    
    # Create tables if they don't exist
    create_tables()
    
    # Create database session
    db = SessionLocal()
    
    try:
        seed_crops(db)
        seed_soil_map(db)
        seed_sample_market_data(db)
        
        print("\n✅ Database seeding completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
