import os
import joblib
from typing import Optional

from app.schemas.common import FatigueLevel
from app.services.feature_engineering import prepare_features_for_model


# path to the trained model
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "ml",
    "saved_models",
    "xgboost_model.joblib"
)

# normalize to absolute path
MODEL_PATH = os.path.normpath(MODEL_PATH)

# cache for the loaded model
_model_cache: Optional[object] = None


def load_model() -> object:
    global _model_cache
    
    if _model_cache is not None:
        return _model_cache
    
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Modèle ML non trouvé à {MODEL_PATH}. "
            f"Veuillez lancer l'entraînement avec: python ml/train.py"
        )
    
    _model_cache = joblib.load(MODEL_PATH)
    return _model_cache


def predict_fatigue(features: dict) -> float:
    model = load_model()
    
    # normalize features for the model
    normalized_features = prepare_features_for_model(features)
    
    # prepare feature vector in the order expected by the model
    feature_vector = [
        normalized_features["shift_duration_h"],
        normalized_features["active_driving_h"],
        normalized_features["time_since_last_break_min"],
        normalized_features["break_count"],
        normalized_features["total_break_min"],
        normalized_features["driving_ratio"],
        normalized_features["is_night"],
        normalized_features["is_post_lunch_dip"],
        normalized_features["hour_sin"],
        normalized_features["hour_cos"],
    ]
    
    # predict
    score = model.predict([feature_vector])[0]
    
    # ensure score is in valid range
    score = max(0.0, min(1.0, score))
    
    return round(score, 4)


def get_fatigue_level(fatigue_score: float) -> FatigueLevel:
    if fatigue_score < 0.3:
        return FatigueLevel.LOW
    elif fatigue_score < 0.6:
        return FatigueLevel.MODERATE
    elif fatigue_score < 0.8:
        return FatigueLevel.HIGH
    else:
        return FatigueLevel.CRITICAL


def reset_model_cache():
    global _model_cache
    _model_cache = None
