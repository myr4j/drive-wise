from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, Field

from app.database.base import get_db
from app.models.feedback import Feedback

router = APIRouter(prefix="/feedback", tags=["feedback"])


class FeedbackRequest(BaseModel):
    message: str = Field(..., min_length=5, max_length=1000)
    category: str = Field(default="general")  # 'bug', 'suggestion', 'general'


@router.post("/")
def submit_feedback(
    payload: FeedbackRequest,
    driver_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    fb = Feedback(driver_id=driver_id, category=payload.category, message=payload.message)
    db.add(fb)
    db.commit()
    return {"message": "Merci pour votre retour !"}
