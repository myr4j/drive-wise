from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base

# import bcrypt directement pour éviter les problèmes de compatibilité
import bcrypt


class DriverPreference(Base):
    __tablename__ = "driver_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), unique=True, nullable=False)
    work_days = Column(String(20), nullable=False, default="1,2,3,4,5")  # 1=Lun…7=Dim
    typical_start_h = Column(Integer, nullable=False, default=8)
    typical_end_h = Column(Integer, nullable=False, default=18)
    revenue_goal = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    driver = relationship("Driver", back_populates="preferences")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # métadonnées
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # consentement RGPD
    consent_at = Column(DateTime, nullable=True)
    consent_version = Column(String(20), nullable=True)
    
    # relation avec les shifts
    shifts = relationship("Shift", back_populates="driver", cascade="all, delete-orphan")
    preferences = relationship("DriverPreference", back_populates="driver", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Driver id={self.id} email={self.email}>"

    def verify_password(self, plain_password: str) -> bool:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            self.hashed_password.encode("utf-8")
        )

    @staticmethod
    def hash_password(plain_password: str) -> str:
        return bcrypt.hashpw(
            plain_password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")
