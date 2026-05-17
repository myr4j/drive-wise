from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.base import get_db
from app.models.driver import Driver
from app.models.shift import Shift, Snapshot

router = APIRouter(prefix="/driver", tags=["driver"])

CONSENT_VERSION = "1.0"


@router.post("/me/consent")
def accept_consent(driver_id: int = Query(...), db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver introuvable")
    driver.consent_at = datetime.utcnow()
    driver.consent_version = CONSENT_VERSION
    db.commit()
    db.refresh(driver)
    return {
        "message": "Consentement enregistré",
        "consent_at": driver.consent_at.isoformat(),
        "consent_version": driver.consent_version,
    }


@router.get("/me/export")
def export_data(driver_id: int = Query(...), db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver introuvable")

    shifts = db.query(Shift).filter(Shift.driver_id == driver_id).all()

    shift_list = []
    for shift in shifts:
        snapshots = db.query(Snapshot).filter(Snapshot.shift_id == shift.id).all()
        shift_list.append({
            "id": shift.id,
            "started_at": shift.started_at.isoformat() if shift.started_at else None,
            "ended_at": shift.ended_at.isoformat() if shift.ended_at else None,
            "status": shift.status,
            "active_driving_h": shift.active_driving_h,
            "total_break_min": shift.total_break_min,
            "break_count": shift.break_count,
            "snapshots": [
                {
                    "timestamp": s.timestamp.isoformat() if s.timestamp else None,
                    "speed_kmh": s.speed_kmh,
                    "latitude": s.latitude,
                    "longitude": s.longitude,
                    "fatigue_score": s.fatigue_score,
                    "fatigue_level": s.fatigue_level,
                }
                for s in snapshots
            ],
        })

    return {
        "exported_at": datetime.utcnow().isoformat(),
        "driver": {
            "id": driver.id,
            "email": driver.email,
            "username": driver.username,
            "created_at": driver.created_at.isoformat() if driver.created_at else None,
            "consent_at": driver.consent_at.isoformat() if driver.consent_at else None,
            "consent_version": driver.consent_version,
        },
        "shifts": shift_list,
    }


@router.delete("/me")
def delete_account(driver_id: int = Query(...), db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver introuvable")

    # Anonymise le compte : email/username effacés, données de conduite conservées
    driver.email = f"deleted_{driver.id}@drivewise.invalid"
    driver.username = f"deleted_{driver.id}"
    driver.hashed_password = ""
    driver.is_active = False
    driver.consent_at = None
    driver.consent_version = None
    db.commit()
    return {"message": "Compte supprimé et données anonymisées"}
