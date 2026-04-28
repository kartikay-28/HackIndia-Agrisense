"""
ML Model Training Script for AgriSense.
Generates synthetic training data and trains crop recommendation and price prediction models.
"""
import sys
import os
from pathlib import Path

# Ensure we run from backend dir so relative paths work
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
os.chdir(BACKEND_DIR)
sys.path.insert(0, str(BACKEND_DIR))

import numpy as np
import pandas as pd
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error, classification_report
import random

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

# Model directory
MODEL_DIR = Path(__file__).parent.parent / "app" / "ml_models"
MODEL_DIR.mkdir(exist_ok=True)

# Crop label mapping
CROP_LABELS = {
    0: "Rice",
    1: "Wheat",
    2: "Cotton",
    3: "Sugarcane",
    4: "Maize",
    5: "Soybean",
    6: "Groundnut",
    7: "Mustard",
    8: "Turmeric",
    9: "Chilli"
}

# Soil type encoding
SOIL_ENCODING = {
    "Alluvial": 0,
    "Black": 1,
    "Red": 2,
    "Laterite": 3,
    "Desert": 4,
    "Loamy": 2  # Same as Red for encoding
}

# State encoding (29 major Indian agricultural states)
STATE_ENCODING = {
    "Punjab": 0, "Haryana": 1, "Uttar Pradesh": 2, "Bihar": 3, "West Bengal": 4,
    "Andhra Pradesh": 5, "Telangana": 6, "Karnataka": 7, "Tamil Nadu": 8, "Kerala": 9,
    "Maharashtra": 10, "Gujarat": 11, "Madhya Pradesh": 12, "Rajasthan": 13,
    "Odisha": 14, "Jharkhand": 15, "Chhattisgarh": 16, "Assam": 17,
    "Himachal Pradesh": 18, "Uttarakhand": 19, "Jammu and Kashmir": 20,
    "Delhi": 21, "Goa": 22, "Manipur": 23, "Meghalaya": 24,
    "Nagaland": 25, "Mizoram": 26, "Tripura": 27, "Sikkim": 28
}

# Crop requirements for realistic data generation
CROP_REQUIREMENTS = {
    "Rice": {
        "temp_range": (20, 35),
        "rainfall_range": (1000, 2500),
        "humidity_range": (60, 80),
        "ph_range": (5.5, 7.0),
        "suitable_soils": ["Alluvial", "Black"],
        "suitable_states": ["Punjab", "Haryana", "Uttar Pradesh", "West Bengal", "Andhra Pradesh", "Tamil Nadu", "Bihar", "Odisha"],
        "base_price": 2000
    },
    "Wheat": {
        "temp_range": (10, 25),
        "rainfall_range": (500, 1000),
        "humidity_range": (50, 70),
        "ph_range": (6.0, 7.5),
        "suitable_soils": ["Alluvial", "Black", "Loamy"],
        "suitable_states": ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Bihar", "Gujarat"],
        "base_price": 2500
    },
    "Cotton": {
        "temp_range": (21, 30),
        "rainfall_range": (500, 1000),
        "humidity_range": (50, 80),
        "ph_range": (6.5, 8.0),
        "suitable_soils": ["Black", "Alluvial"],
        "suitable_states": ["Gujarat", "Maharashtra", "Andhra Pradesh", "Telangana", "Punjab", "Haryana"],
        "base_price": 6000
    },
    "Sugarcane": {
        "temp_range": (20, 35),
        "rainfall_range": (1000, 1500),
        "humidity_range": (60, 80),
        "ph_range": (6.0, 7.5),
        "suitable_soils": ["Alluvial", "Black", "Red"],
        "suitable_states": ["Uttar Pradesh", "Maharashtra", "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Bihar", "Punjab"],
        "base_price": 3000
    },
    "Maize": {
        "temp_range": (18, 32),
        "rainfall_range": (500, 1000),
        "humidity_range": (50, 70),
        "ph_range": (5.5, 7.5),
        "suitable_soils": ["Alluvial", "Red", "Black"],
        "suitable_states": ["Karnataka", "Andhra Pradesh", "Rajasthan", "Madhya Pradesh", "Bihar", "Uttar Pradesh", "Maharashtra"],
        "base_price": 1800
    },
    "Soybean": {
        "temp_range": (20, 30),
        "rainfall_range": (500, 900),
        "humidity_range": (60, 80),
        "ph_range": (6.0, 7.5),
        "suitable_soils": ["Black", "Red", "Alluvial"],
        "suitable_states": ["Madhya Pradesh", "Maharashtra", "Rajasthan", "Karnataka", "Telangana"],
        "base_price": 4000
    },
    "Groundnut": {
        "temp_range": (20, 30),
        "rainfall_range": (500, 750),
        "humidity_range": (50, 70),
        "ph_range": (6.0, 7.0),
        "suitable_soils": ["Red", "Black", "Alluvial"],
        "suitable_states": ["Gujarat", "Andhra Pradesh", "Tamil Nadu", "Karnataka", "Rajasthan", "Maharashtra"],
        "base_price": 5000
    },
    "Mustard": {
        "temp_range": (10, 25),
        "rainfall_range": (250, 500),
        "humidity_range": (50, 70),
        "ph_range": (6.0, 7.5),
        "suitable_soils": ["Alluvial", "Loamy"],
        "suitable_states": ["Rajasthan", "Uttar Pradesh", "Haryana", "Madhya Pradesh", "Gujarat", "West Bengal"],
        "base_price": 5500
    },
    "Turmeric": {
        "temp_range": (20, 35),
        "rainfall_range": (1500, 2250),
        "humidity_range": (60, 90),
        "ph_range": (5.5, 7.5),
        "suitable_soils": ["Red", "Black", "Alluvial"],
        "suitable_states": ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Maharashtra", "Odisha", "Karnataka"],
        "base_price": 8000
    },
    "Chilli": {
        "temp_range": (20, 35),
        "rainfall_range": (600, 1250),
        "humidity_range": (60, 80),
        "ph_range": (6.0, 7.5),
        "suitable_soils": ["Red", "Black", "Alluvial"],
        "suitable_states": ["Andhra Pradesh", "Telangana", "Karnataka", "Maharashtra", "Tamil Nadu", "Odisha"],
        "base_price": 7000
    }
}


def generate_training_data(num_samples=5000):
    """
    Generate synthetic training data based on crop requirements.
    Creates realistic correlations between features and crop labels.
    """
    print(f"Generating {num_samples} training samples...")
    
    data = []
    
    for _ in range(num_samples):
        # Randomly select a crop
        crop_label = random.randint(0, 9)
        crop_name = CROP_LABELS[crop_label]
        crop_req = CROP_REQUIREMENTS[crop_name]
        
        # Generate features within crop's suitable ranges (with ±20% noise)
        temp_min, temp_max = crop_req["temp_range"]
        temp = random.uniform(temp_min * 0.8, temp_max * 1.2)
        
        rain_min, rain_max = crop_req["rainfall_range"]
        rainfall = random.uniform(rain_min * 0.8, rain_max * 1.2)
        
        hum_min, hum_max = crop_req["humidity_range"]
        humidity = random.uniform(hum_min * 0.8, hum_max * 1.2)
        humidity = max(30, min(100, humidity))  # Clamp to valid range
        
        ph_min, ph_max = crop_req["ph_range"]
        ph_level = random.uniform(ph_min * 0.9, ph_max * 1.1)
        ph_level = max(4.5, min(8.5, ph_level))  # Clamp to valid range
        
        # Select suitable soil and state
        soil_type = random.choice(crop_req["suitable_soils"])
        soil_encoded = SOIL_ENCODING[soil_type]
        
        state = random.choice(crop_req["suitable_states"])
        state_encoded = STATE_ENCODING[state]
        
        # Random month (1-12)
        month = random.randint(1, 12)
        
        # Generate price with variation
        base_price = crop_req["base_price"]
        price_variation = random.uniform(0.8, 1.2)
        price = base_price * price_variation
        
        data.append({
            "temperature": round(temp, 2),
            "humidity": round(humidity, 2),
            "rainfall_mm": round(rainfall, 2),
            "ph_level": round(ph_level, 2),
            "soil_type_encoded": soil_encoded,
            "state_encoded": state_encoded,
            "month": month,
            "crop_label": crop_label,
            "price_per_quintal": round(price, 2)
        })
    
    df = pd.DataFrame(data)
    print(f"✅ Generated {len(df)} samples")
    return df


def train_crop_model(X_train, y_train, X_test, y_test):
    """Train RandomForest classifier for crop recommendations."""
    print("\n🌾 Training Crop Recommendation Model...")
    
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        random_state=42,
        n_jobs=-1,
        class_weight='balanced'
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"✅ Crop Model Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    
    # Detailed classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=list(CROP_LABELS.values())))
    
    return model, accuracy


def train_price_model(X_train, y_train, X_test, y_test):
    """Train DecisionTree regressor for price predictions."""
    print("\n💰 Training Price Prediction Model...")
    
    model = DecisionTreeRegressor(
        max_depth=8,
        random_state=42,
        min_samples_split=10,
        min_samples_leaf=5
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
    
    print(f"✅ Price Model MAE: ₹{mae:.2f}")
    print(f"✅ Price Model MAPE: {mape:.2f}%")
    
    return model, mae


def save_models(crop_model, price_model, crop_accuracy, price_mae):
    """Save trained models and metadata."""
    print("\n💾 Saving models...")
    
    # Save crop model
    crop_model_path = MODEL_DIR / "crop_model.pkl"
    with open(crop_model_path, "wb") as f:
        pickle.dump(crop_model, f)
    print(f"✅ Saved crop model to {crop_model_path}")
    
    # Save price model
    price_model_path = MODEL_DIR / "price_model.pkl"
    with open(price_model_path, "wb") as f:
        pickle.dump(price_model, f)
    print(f"✅ Saved price model to {price_model_path}")
    
    # Save label encoder
    label_encoder_path = MODEL_DIR / "label_encoder.pkl"
    with open(label_encoder_path, "wb") as f:
        pickle.dump(CROP_LABELS, f)
    print(f"✅ Saved label encoder to {label_encoder_path}")
    
    # Save encodings
    encodings = {
        "soil_encoding": SOIL_ENCODING,
        "state_encoding": STATE_ENCODING
    }
    encodings_path = MODEL_DIR / "encodings.pkl"
    with open(encodings_path, "wb") as f:
        pickle.dump(encodings, f)
    print(f"✅ Saved encodings to {encodings_path}")
    
    # Save metadata
    metadata = {
        "crop_model": {
            "accuracy": crop_accuracy,
            "model_type": "RandomForestClassifier",
            "n_estimators": 150,
            "max_depth": 12
        },
        "price_model": {
            "mae": price_mae,
            "model_type": "DecisionTreeRegressor",
            "max_depth": 8
        },
        "crops": list(CROP_LABELS.values()),
        "features": ["temperature", "humidity", "rainfall_mm", "ph_level", "soil_type_encoded", "state_encoded", "month"]
    }
    
    metadata_path = MODEL_DIR / "model_metadata.pkl"
    with open(metadata_path, "wb") as f:
        pickle.dump(metadata, f)
    print(f"✅ Saved metadata to {metadata_path}")


def main():
    """Main training function."""
    print("🚀 Starting ML Model Training for AgriSense\n")
    print("=" * 60)
    
    # Generate training data
    df = generate_training_data(num_samples=5000)
    
    # Prepare features and labels
    feature_columns = ["temperature", "humidity", "rainfall_mm", "ph_level", 
                      "soil_type_encoded", "state_encoded", "month"]
    
    X = df[feature_columns].values
    y_crop = df["crop_label"].values
    y_price = df["price_per_quintal"].values
    
    # Split data
    X_train, X_test, y_crop_train, y_crop_test, y_price_train, y_price_test = train_test_split(
        X, y_crop, y_price, test_size=0.2, random_state=42
    )
    
    print(f"\n📊 Dataset Split:")
    print(f"   Training samples: {len(X_train)}")
    print(f"   Testing samples: {len(X_test)}")
    
    # Train models
    crop_model, crop_accuracy = train_crop_model(X_train, y_crop_train, X_test, y_crop_test)
    price_model, price_mae = train_price_model(X_train, y_price_train, X_test, y_price_test)
    
    # Save models
    save_models(crop_model, price_model, crop_accuracy, price_mae)
    
    print("\n" + "=" * 60)
    print("✅ ML Model Training Completed Successfully!")
    print(f"   Crop Model Accuracy: {crop_accuracy*100:.2f}%")
    print(f"   Price Model MAE: ₹{price_mae:.2f}")
    print(f"   Models saved to: {MODEL_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
