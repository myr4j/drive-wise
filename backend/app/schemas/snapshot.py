from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict
from app.schemas.common import FatigueLevel, Suggestion


class SnapshotRequest(BaseModel):
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Horodatage de la mesure (UTC)"
    )
    speed_kmh: float = Field(
        ge=0,
        le=200,
        description="Vitesse GPS en km/h"
    )
    latitude: float = Field(
        ge=-90, le=90,
        description="Latitude GPS"
    )
    longitude: float = Field(
        ge=-180, le=180,
        description="Longitude GPS"
    )


class ComputedFeatures(BaseModel):
    shift_duration_h: float = Field(ge=0, le=12)
    active_driving_h: float = Field(ge=0, le=12)
    time_since_last_break_min: float = Field(ge=0, le=240)
    break_count: int = Field(ge=0)
    total_break_min: float = Field(ge=0)
    driving_ratio: float = Field(ge=0, le=1)
    is_night: int = Field(ge=0, le=1)
    is_post_lunch_dip: int = Field(ge=0, le=1)
    hour_sin: float = Field(ge=-1, le=1)
    hour_cos: float = Field(ge=-1, le=1)


class ShapContribution(BaseModel):
    feature: str = Field(description="nom technique de la feature")
    label: str = Field(description="nom lisible de la feature")
    value: float = Field(description="valeur de la feature")
    shap_value: float = Field(description="valeur SHAP brute")
    impact: float = Field(description="impact absolu")
    direction: str = Field(description="positive (augmente fatigue) ou negative (diminue)")


class ShapExplanation(BaseModel):
    base_value: float = Field(description="valeur de base (prédiction moyenne)")
    predicted_value: float = Field(description="valeur prédite par le modèle")
    shap_values: Dict[str, float] = Field(description="valeurs SHAP par feature")
    contributions: List[ShapContribution] = Field(description="liste des contributions triées")
    top_positive: List[ShapContribution] = Field(description="features qui augmentent la fatigue")
    top_negative: List[ShapContribution] = Field(description="features qui diminuent la fatigue")
    feature_importance_ranking: List[str] = Field(description="classement des features par impact")
    explanation_text: str = Field(description="explication textuelle naturelle")


class SnapshotResponse(BaseModel):
    snapshot_id: int
    fatigue_score: float = Field(
        ge=0, le=1,
        description="Score brut de fatigue"
    )
    fatigue_level: FatigueLevel = Field(
        description="Niveau categorise selon seuils 0.3/0.6/0.8"
    )
    suggestion: Optional[Suggestion] = Field(
        default=None,
        description="Presente uniquement si fatigue_score >= 0.3"
    )
    explanation: Optional[ShapExplanation] = Field(
        default=None,
        description="Explication SHAP de la prédiction (optionnel)"
    )
