from enum import Enum
from pydantic import BaseModel, Field


class FatigueLevel(str, Enum):
    LOW = "low"              # < 0.3
    MODERATE = "moderate"    # 0.3 - 0.6
    HIGH = "high"            # 0.6 - 0.8
    CRITICAL = "critical"    # > 0.8


class Suggestion(BaseModel):
    fatigue_level: FatigueLevel = Field(
        description="Niveau ayant declenche la suggestion"
    )
    message: str = Field(
        description="Message personnalise genere par le LLM"
    )
    delivery: str = Field(
        description="Canal : none, in_app, push_soft, push_strong"
    )
