from sqlalchemy import (
    Column, Integer, Float, String, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="active")

    # metriques aggregees (remplies au end_shift)
    active_driving_h = Column(Float, nullable=True)
    total_break_min = Column(Float, nullable=True)
    break_count = Column(Integer, nullable=True)

    # suivi des suggestions (pour éviter le harcèlement)
    last_suggestion_time = Column(DateTime, nullable=True)
    last_fatigue_level = Column(String(20), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    driver = relationship("Driver", back_populates="shifts")
    
    snapshots = relationship(
        "Snapshot",
        back_populates="shift",
        cascade="all, delete-orphan",
        order_by="Snapshot.timestamp"
    )

    def __repr__(self):
        return f"<Shift id={self.id} status={self.status}>"


class Snapshot(Base):
    __tablename__ = "snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False)

    speed_kmh = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    shift_duration_h = Column(Float, nullable=True)
    active_driving_h = Column(Float, nullable=True)
    time_since_last_break_min = Column(Float, nullable=True)
    break_count = Column(Integer, nullable=True)
    total_break_min = Column(Float, nullable=True)
    driving_ratio = Column(Float, nullable=True)
    is_night = Column(Integer, nullable=True)
    is_post_lunch_dip = Column(Integer, nullable=True)
    hour_sin = Column(Float, nullable=True)
    hour_cos = Column(Float, nullable=True)

    fatigue_score = Column(Float, nullable=True)
    fatigue_level = Column(String(20), nullable=True)

    suggestion_given = Column(Integer, default=0)
    suggestion_message = Column(String(500), nullable=True)
    suggestion_delivery = Column(String(20), nullable=True)

    shift = relationship("Shift", back_populates="snapshots")

    __table_args__ = (
        Index("ix_snapshots_shift_id", "shift_id"),
        Index("ix_snapshots_shift_timestamp", "shift_id", "timestamp"),
    )

    def __repr__(self):
        return f"<Snapshot id={self.id} shift={self.shift_id} fatigue={self.fatigue_level}>"
