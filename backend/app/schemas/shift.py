from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.schemas.common import FatigueLevel, Suggestion

class ShiftStartRequest(BaseModel):
    started_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Heure de debut du shift (UTC)"
    )


class ShiftStartResponse(BaseModel):
    shift_id: int
    started_at: datetime
    message: str = "Shift demarre avec succes"


class ShiftEndResponse(BaseModel):
    shift_id: int
    started_at: datetime
    ended_at: datetime
    duration_h: float = Field(description="Duree totale du shift en heures")
    active_driving_h: float = Field(description="Heures de conduite effective")
    total_break_min: float = Field(description="Minutes de pause cumulees")
    break_count: int = Field(description="Nombre de pauses prises")
    total_snapshots: int
    avg_fatigue_score: float = Field(ge=0, le=1)
    max_fatigue_score: float = Field(ge=0, le=1)
    fatigue_peaks_count: int = Field(
        description="Nombre de snapshots avec fatigue > 0.6"
    )
    suggestions_given: int
    summary: str = Field(
        description="Resume genere par le LLM"
    )
