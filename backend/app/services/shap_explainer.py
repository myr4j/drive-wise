"""
service SHAP pour expliquer les prédictions de fatigue

SHAP (SHapley Additive exPlanations) explique pourquoi le modèle a prédit
un certain score de fatigue en décomposant la contribution de chaque feature.
"""
import os
import joblib
import numpy as np
from typing import Optional, Dict, List

import shap
from xgboost import XGBRegressor

from app.services.feature_engineering import prepare_features_for_model


# chemin vers le modèle
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "ml",
    "saved_models",
    "xgboost_model.joblib"
)
MODEL_PATH = os.path.normpath(MODEL_PATH)

# cache pour l'explainer SHAP
_explainer_cache: Optional[shap.Explainer] = None
_model_cache: Optional[XGBRegressor] = None

# noms des features (dans l'ordre attendu par le modèle)
FEATURE_NAMES = [
    "shift_duration_h",
    "active_driving_h",
    "time_since_last_break_min",
    "break_count",
    "total_break_min",
    "driving_ratio",
    "is_night",
    "is_post_lunch_dip",
    "hour_sin",
    "hour_cos",
]

# noms affichables pour les explications
FEATURE_LABELS = {
    "shift_duration_h": "durée du shift",
    "active_driving_h": "temps de conduite",
    "time_since_last_break_min": "temps depuis dernière pause",
    "break_count": "nombre de pauses",
    "total_break_min": "durée totale des pauses",
    "driving_ratio": "ratio de conduite",
    "is_night": "conduite de nuit",
    "is_post_lunch_dip": "creux post-déjeuner",
    "hour_sin": "heure (cycle circadien)",
    "hour_cos": "heure (cycle circadien)",
}


def load_model() -> XGBRegressor:
    """charge le modèle XGBoost"""
    global _model_cache

    if _model_cache is not None:
        return _model_cache

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"modèle ML non trouvé à {MODEL_PATH}. "
            f"lancer l'entraînement avec: python ml/train.py"
        )

    _model_cache = joblib.load(MODEL_PATH)
    return _model_cache


def get_explainer() -> shap.Explainer:
    """crée ou retourne l'explainer SHAP en cache"""
    global _explainer_cache, _model_cache

    if _explainer_cache is not None:
        return _explainer_cache

    model = load_model()

    # crée l'explainer SHAP pour XGBoost
    _explainer_cache = shap.Explainer(model)

    return _explainer_cache


def explain_prediction(features: dict) -> dict:
    """
    explique une prédiction de fatigue en décomposant la contribution de chaque feature.

    args:
        features: dictionnaire avec les 10 features calculées par feature_engineering

    returns:
        dictionnaire contenant:
        - base_value: valeur de base (prédiction moyenne)
        - predicted_value: valeur prédite
        - shap_values: valeurs SHAP brutes par feature
        - contributions: liste des contributions triées par impact
        - top_positive: features qui augmentent la fatigue
        - top_negative: features qui diminuent la fatigue
    """
    model = load_model()
    explainer = get_explainer()

    # prépare les features pour le modèle
    normalized = prepare_features_for_model(features)

    # crée le vecteur de features dans l'ordre attendu
    feature_vector = [
        normalized["shift_duration_h"],
        normalized["active_driving_h"],
        normalized["time_since_last_break_min"],
        normalized["break_count"],
        normalized["total_break_min"],
        normalized["driving_ratio"],
        normalized["is_night"],
        normalized["is_post_lunch_dip"],
        normalized["hour_sin"],
        normalized["hour_cos"],
    ]

    # calcule les valeurs SHAP
    shap_values = explainer(np.array([feature_vector]))

    # valeur de base (prédiction moyenne sur le dataset d'entraînement)
    base_value = float(shap_values.base_values[0]) if hasattr(shap_values.base_values[0], '__float__') else float(shap_values.base_values[0])

    # valeur prédite
    predicted_value = float(model.predict([feature_vector])[0])

    # décompose les contributions par feature
    contributions = []
    for i, name in enumerate(FEATURE_NAMES):
        shap_val = float(shap_values.values[0, i])
        contributions.append({
            "feature": name,
            "label": FEATURE_LABELS[name],
            "value": features[name],
            "shap_value": shap_val,
            "impact": abs(shap_val),
            "direction": "positive" if shap_val > 0 else "negative",
        })

    # trie par impact décroissant
    contributions = sorted(contributions, key=lambda x: x["impact"], reverse=True)

    # sépare les features qui augmentent vs diminuent la fatigue
    top_positive = [c for c in contributions if c["shap_value"] > 0]
    top_negative = [c for c in contributions if c["shap_value"] < 0]

    return {
        "base_value": round(base_value, 4),
        "predicted_value": round(predicted_value, 4),
        "shap_values": {c["feature"]: round(c["shap_value"], 6) for c in contributions},
        "contributions": contributions,
        "top_positive": top_positive,
        "top_negative": top_negative,
        "feature_importance_ranking": [c["label"] for c in contributions],
    }


def generate_explanation_text(explanation: dict) -> str:
    """
    génère une explication textuelle naturelle de la prédiction.

    args:
        explanation: résultat de explain_prediction()

    returns:
        string explicatif en français
    """
    predicted = explanation["predicted_value"]
    base = explanation["base_value"]
    top_positive = explanation["top_positive"][:3]  # top 3
    top_negative = explanation["top_negative"][:3]  # top 3

    # commence par le score
    text = f"score de fatigue: {predicted:.2f}"

    if predicted < 0.3:
        text += " (faible)"
    elif predicted < 0.6:
        text += " (modéré)"
    elif predicted < 0.8:
        text += " (élevé)"
    else:
        text += " (critique)"

    text += ".\n\n"

    # facteurs qui augmentent la fatigue
    if top_positive:
        text += "facteurs qui augmentent la fatigue:\n"
        for item in top_positive:
            label = item["label"]
            value = item["value"]
            impact = item["shap_value"]
            text += f"  • {label}: {value} (+{impact:.3f})\n"
        text += "\n"

    # facteurs qui diminuent la fatigue
    if top_negative:
        text += "facteurs qui diminuent la fatigue:\n"
        for item in top_negative:
            label = item["label"]
            value = item["value"]
            impact = item["shap_value"]
            text += f"  • {label}: {value} ({impact:.3f})\n"

    return text.strip()


def get_feature_importance() -> dict:
    """
    retourne l'importance globale des features du modèle.

    returns:
        dictionnaire {feature: importance} trié par importance décroissante
    """
    model = load_model()

    importance_dict = {}
    for i, name in enumerate(FEATURE_NAMES):
        importance_dict[FEATURE_LABELS[name]] = float(model.feature_importances_[i])

    # trie par importance décroissante
    sorted_importance = dict(
        sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
    )

    return {
        "importance": sorted_importance,
        "ranking": list(sorted_importance.keys()),
    }


def reset_cache():
    """réinitialise le cache (utile pour les tests)"""
    global _explainer_cache, _model_cache
    _explainer_cache = None
    _model_cache = None
