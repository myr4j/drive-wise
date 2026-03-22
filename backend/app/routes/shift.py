from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.models.shift import Shift, Snapshot
from app.schemas.shift import ShiftStartRequest, ShiftStartResponse, ShiftEndResponse
from app.schemas.snapshot import SnapshotRequest, SnapshotResponse

router = APIRouter(prefix="/shift", tags=["shift"])


@router.post("/start", response_model=ShiftStartResponse, status_code=201)
def start_shift(payload: ShiftStartRequest, db: Session = Depends(get_db)):
    active = db.query(Shift).filter(Shift.status == "active").first()
    if active:
        raise HTTPException(
            status_code=409,
            detail=f"Shift {active.id} deja actif. Terminez-le avant d'en demarrer un nouveau."
        )

    shift = Shift(started_at=payload.started_at, status="active")
    db.add(shift)
    db.commit()
    db.refresh(shift)

    return ShiftStartResponse(shift_id=shift.id, started_at=shift.started_at)


@router.post("/{shift_id}/snapshot", response_model=SnapshotResponse, status_code=201)
def create_snapshot(shift_id: int, payload: SnapshotRequest, db: Session = Depends(get_db)):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift introuvable")
    if shift.status != "active":
        raise HTTPException(status_code=400, detail="Shift non actif")

    snapshot = Snapshot(
        shift_id=shift_id,
        timestamp=payload.timestamp,
        speed_kmh=payload.speed_kmh,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    # TODO: appeler le service de feature engineering + scoring
    # pour l'instant on retourne des valeurs placeholder
    return SnapshotResponse(
        snapshot_id=snapshot.id,
        fatigue_score=0.0,
        fatigue_level="low",
        suggestion=None,
    )


@router.post("/{shift_id}/end", response_model=ShiftEndResponse)
def end_shift(shift_id: int, db: Session = Depends(get_db)):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift introuvable")
    if shift.status != "active":
        raise HTTPException(status_code=400, detail="Shift deja termine")

    from datetime import datetime
    shift.ended_at = datetime.utcnow()
    shift.status = "completed"

    snapshots = db.query(Snapshot).filter(Snapshot.shift_id == shift_id).all()
    total = len(snapshots)
    scores = [s.fatigue_score for s in snapshots if s.fatigue_score is not None]

    duration_h = (shift.ended_at - shift.started_at).total_seconds() / 3600

    # TODO: calculer les vraies metriques via le service
    shift.active_driving_h = 0.0
    shift.total_break_min = 0.0
    shift.break_count = 0

    db.commit()
    db.refresh(shift)

    return ShiftEndResponse(
        shift_id=shift.id,
        started_at=shift.started_at,
        ended_at=shift.ended_at,
        duration_h=round(duration_h, 2),
        active_driving_h=shift.active_driving_h or 0.0,
        total_break_min=shift.total_break_min or 0.0,
        break_count=shift.break_count or 0,
        total_snapshots=total,
        avg_fatigue_score=round(sum(scores) / len(scores), 4) if scores else 0.0,
        max_fatigue_score=max(scores) if scores else 0.0,
        fatigue_peaks_count=sum(1 for s in scores if s > 0.6),
        suggestions_given=sum(1 for s in snapshots if s.suggestion_given == 1),
        summary="Resume a implementer via LLM",
    )


@router.get("/{shift_id}/status")
def get_shift_status(shift_id: int, db: Session = Depends(get_db)):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift introuvable")

    last_snapshot = (
        db.query(Snapshot)
        .filter(Snapshot.shift_id == shift_id)
        .order_by(Snapshot.timestamp.desc())
        .first()
    )

    duration_h = None
    if shift.started_at:
        from datetime import datetime
        now = shift.ended_at or datetime.utcnow()
        duration_h = round((now - shift.started_at).total_seconds() / 3600, 2)

    return {
        "shift_id": shift.id,
        "status": shift.status,
        "started_at": shift.started_at,
        "ended_at": shift.ended_at,
        "duration_h": duration_h,
        "snapshot_count": db.query(Snapshot).filter(Snapshot.shift_id == shift_id).count(),
        "last_fatigue_score": last_snapshot.fatigue_score if last_snapshot else None,
        "last_fatigue_level": last_snapshot.fatigue_level if last_snapshot else None,
    }
