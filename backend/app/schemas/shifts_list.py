from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class ShiftListItem(BaseModel):
    id: int
    driver_id: Optional[int]
    started_at: datetime
    ended_at: Optional[datetime]
    status: str
    duration_h: Optional[float]
    avg_fatigue_score: Optional[float]
    max_fatigue_score: Optional[float]
    
    class Config:
        from_attributes = True


class ShiftsListResponse(BaseModel):
    shifts: List[ShiftListItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class DriverStatsResponse(BaseModel):
    total_shifts: int
    total_driving_hours: float
    total_break_minutes: float
    avg_breaks_per_shift: float
    
    avg_fatigue_score: float
    max_fatigue_score: float
    total_fatigue_peaks: int
    
    fatigue_distribution: dict
    
    fatigue_trend_7_days: List[dict]
