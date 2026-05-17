from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

from app.database.base import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    category = Column(String(20), nullable=False, default="general")  # bug, suggestion, general
    message = Column(String(1000), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
