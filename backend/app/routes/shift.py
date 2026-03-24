from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta
from typing import Optional, List

from app.database.base import get_db
from app.models.shift import Shift, Snapshot
from app.models.driver import Driver
from app.schemas.shift import ShiftStartRequest, ShiftStartResponse, ShiftEndResponse
from app.schemas.snapshot import SnapshotRequest, SnapshotResponse
from app.schemas.common import FatigueLevel
from app.services.feature_engineering import compute_features
from app.services.predictor import predict_fatigue, get_fatigue_level
from app.services.suggestion import generate_suggestion, should_generate_suggestion
from app.services.shap_explainer import explain_prediction, generate_explanation_text, get_feature_importance
from app.schemas.snapshot import ShapExplanation, ShapContribution
from app.schemas.shifts_list import ShiftListItem, ShiftsListResponse, DriverStatsResponse

router = APIRouter(prefix="/shift", tags=["shift"])


@router.post("/start", response_model=ShiftStartResponse, status_code=201)
def start_shift(
    payload: ShiftStartRequest,
    db: Session = Depends(get_db),
    driver_id: Optional[int] = Query(None, description="ID du chauffeur"),
):
    # vérifie pas de shift actif pour ce driver
    query = db.query(Shift).filter(Shift.status == "active")
    if driver_id:
        query = query.filter(Shift.driver_id == driver_id)
    
    active = query.first()
    if active:
        raise HTTPException(
            status_code=409,
            detail=f"Shift {active.id} deja actif. Terminez-le avant d'en demarrer un nouveau."
        )

    shift = Shift(started_at=payload.started_at, status="active", driver_id=driver_id)
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

    # compute features from shift history and current snapshot
    all_snapshots = db.query(Snapshot).filter(Snapshot.shift_id == shift_id).all()
    features = compute_features(shift, snapshot, all_snapshots)

    # save computed features to snapshot for later ML prediction
    snapshot.shift_duration_h = features["shift_duration_h"]
    snapshot.active_driving_h = features["active_driving_h"]
    snapshot.time_since_last_break_min = features["time_since_last_break_min"]
    snapshot.break_count = features["break_count"]
    snapshot.total_break_min = features["total_break_min"]
    snapshot.driving_ratio = features["driving_ratio"]
    snapshot.is_night = features["is_night"]
    snapshot.is_post_lunch_dip = features["is_post_lunch_dip"]
    snapshot.hour_sin = features["hour_sin"]
    snapshot.hour_cos = features["hour_cos"]

    # predict fatigue score using ML model
    try:
        fatigue_score = predict_fatigue(features)
    except FileNotFoundError:
        # model not trained yet, use placeholder
        fatigue_score = 0.0

    fatigue_level = get_fatigue_level(fatigue_score)

    # generate suggestion with anti-harassment logic
    suggestion = None
    if should_generate_suggestion(fatigue_level, shift.last_suggestion_time, shift.last_fatigue_level):
        suggestion = generate_suggestion(fatigue_score, fatigue_level, features)
        if suggestion:
            # save suggestion to snapshot
            snapshot.suggestion_given = 1
            snapshot.suggestion_message = suggestion.message
            snapshot.suggestion_delivery = suggestion.delivery
            
            # update shift tracking
            shift.last_suggestion_time = datetime.utcnow()
            shift.last_fatigue_level = fatigue_level.value

    # save predictions to snapshot
    snapshot.fatigue_score = fatigue_score
    snapshot.fatigue_level = fatigue_level.value

    db.commit()

    # generate SHAP explanation (optional, peut échouer si modèle non chargé)
    explanation = None
    try:
        shap_result = explain_prediction(features)
        explanation_text = generate_explanation_text(shap_result)
        explanation = ShapExplanation(
            base_value=shap_result["base_value"],
            predicted_value=shap_result["predicted_value"],
            shap_values=shap_result["shap_values"],
            contributions=[
                ShapContribution(
                    feature=c["feature"],
                    label=c["label"],
                    value=c["value"],
                    shap_value=c["shap_value"],
                    impact=c["impact"],
                    direction=c["direction"],
                )
                for c in shap_result["contributions"]
            ],
            top_positive=[
                ShapContribution(
                    feature=c["feature"],
                    label=c["label"],
                    value=c["value"],
                    shap_value=c["shap_value"],
                    impact=c["impact"],
                    direction=c["direction"],
                )
                for c in shap_result["top_positive"]
            ],
            top_negative=[
                ShapContribution(
                    feature=c["feature"],
                    label=c["label"],
                    value=c["value"],
                    shap_value=c["shap_value"],
                    impact=c["impact"],
                    direction=c["direction"],
                )
                for c in shap_result["top_negative"]
            ],
            feature_importance_ranking=shap_result["feature_importance_ranking"],
            explanation_text=explanation_text,
        )
    except Exception:
        # explication non critique, on continue sans
        pass

    return SnapshotResponse(
        snapshot_id=snapshot.id,
        fatigue_score=fatigue_score,
        fatigue_level=fatigue_level,
        suggestion=suggestion,
        explanation=explanation,
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

    # calculate aggregate metrics from the last snapshot
    if snapshots:
        last_snapshot = max(snapshots, key=lambda s: s.timestamp)
        shift.active_driving_h = last_snapshot.active_driving_h or 0.0
        shift.total_break_min = last_snapshot.total_break_min or 0.0
        shift.break_count = last_snapshot.break_count or 0
    else:
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


@router.get("/ml/feature-importance")
def get_ml_feature_importance():
    """
    retourne l'importance globale des features du modèle ML.
    
    utile pour comprendre quelles features influencent le plus la prédiction de fatigue.
    """
    try:
        importance = get_feature_importance()
        return {
            "status": "success",
            "feature_importance": importance["importance"],
            "ranking": importance["ranking"],
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"erreur lors du chargement du modèle: {str(e)}")


@router.get("/s", response_model=ShiftsListResponse)
def list_shifts(
    db: Session = Depends(get_db),
    driver_id: Optional[int] = Query(None, description="filtrer par ID du chauffeur"),
    status: Optional[str] = Query(None, description="filtrer par statut (active/completed)"),
    from_date: Optional[datetime] = Query(None, description="date de début (ISO 8601)"),
    to_date: Optional[datetime] = Query(None, description="date de fin (ISO 8601)"),
    page: int = Query(1, ge=1, description="numéro de page"),
    per_page: int = Query(20, ge=1, le=100, description="nombre d'éléments par page"),
):
    """
    retourne la liste des shifts avec pagination et filtres.
    """
    # construit la query de base
    query = db.query(Shift)
    
    # applique les filtres
    if driver_id is not None:
        query = query.filter(Shift.driver_id == driver_id)
    
    if status:
        query = query.filter(Shift.status == status)
    
    if from_date:
        query = query.filter(Shift.started_at >= from_date)
    
    if to_date:
        query = query.filter(Shift.started_at <= to_date)
    
    # compte le total avant pagination
    total = query.count()
    
    # applique pagination et tri (date décroissante)
    shifts = (
        query
        .order_by(Shift.started_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    
    # calcule le nombre total de pages
    total_pages = (total + per_page - 1) // per_page
    
    # formate la réponse
    shift_items = []
    for shift in shifts:
        # calcule la durée
        duration_h = None
        if shift.started_at and shift.ended_at:
            duration_h = round((shift.ended_at - shift.started_at).total_seconds() / 3600, 2)
        
        # récupère les scores de fatigue des snapshots
        snapshots = db.query(Snapshot).filter(
            Snapshot.shift_id == shift.id,
            Snapshot.fatigue_score.isnot(None)
        ).all()
        
        avg_score = None
        max_score = None
        if snapshots:
            scores = [s.fatigue_score for s in snapshots]
            avg_score = round(sum(scores) / len(scores), 4)
            max_score = round(max(scores), 4)
        
        shift_items.append(ShiftListItem(
            id=shift.id,
            driver_id=shift.driver_id,
            started_at=shift.started_at,
            ended_at=shift.ended_at,
            status=shift.status,
            duration_h=duration_h,
            avg_fatigue_score=avg_score,
            max_fatigue_score=max_score,
        ))
    
    return ShiftsListResponse(
        shifts=shift_items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.get("/driver/stats", response_model=DriverStatsResponse)
def get_driver_stats(
    db: Session = Depends(get_db),
    driver_id: Optional[int] = Query(None, description="ID du chauffeur"),
    from_date: Optional[datetime] = Query(None, description="date de début (ISO 8601)"),
    to_date: Optional[datetime] = Query(None, description="date de fin (ISO 8601)"),
):
    """
    retourne les statistiques agrégées pour un chauffeur.
    """
    # filtre les shifts
    query = db.query(Shift).filter(Shift.status == "completed")
    
    if driver_id is not None:
        query = query.filter(Shift.driver_id == driver_id)
    
    if from_date:
        query = query.filter(Shift.started_at >= from_date)
    
    if to_date:
        query = query.filter(Shift.started_at <= to_date)
    
    shifts = query.all()
    
    if not shifts:
        return DriverStatsResponse(
            total_shifts=0,
            total_driving_hours=0.0,
            total_break_minutes=0.0,
            avg_breaks_per_shift=0.0,
            avg_fatigue_score=0.0,
            max_fatigue_score=0.0,
            total_fatigue_peaks=0,
            fatigue_distribution={"low": 0, "moderate": 0, "high": 0, "critical": 0},
            fatigue_trend_7_days=[],
        )
    
    # métriques de base
    total_shifts = len(shifts)
    total_driving_hours = sum(s.active_driving_h or 0.0 for s in shifts)
    total_break_minutes = sum(s.total_break_min or 0.0 for s in shifts)
    total_breaks = sum(s.break_count or 0 for s in shifts)
    avg_breaks_per_shift = round(total_breaks / total_shifts, 2) if total_shifts > 0 else 0.0
    
    # récupère tous les scores de fatigue
    all_scores = []
    fatigue_distribution = {"low": 0, "moderate": 0, "high": 0, "critical": 0}
    total_fatigue_peaks = 0
    
    for shift in shifts:
        snapshots = db.query(Snapshot).filter(
            Snapshot.shift_id == shift.id,
            Snapshot.fatigue_score.isnot(None)
        ).all()
        
        for snapshot in snapshots:
            all_scores.append(snapshot.fatigue_score)
            
            # distribution par niveau
            if snapshot.fatigue_score < 0.3:
                fatigue_distribution["low"] += 1
            elif snapshot.fatigue_score < 0.6:
                fatigue_distribution["moderate"] += 1
            elif snapshot.fatigue_score < 0.8:
                fatigue_distribution["high"] += 1
            else:
                fatigue_distribution["critical"] += 1
            
            # compte les pics (> 0.6)
            if snapshot.fatigue_score > 0.6:
                total_fatigue_peaks += 1
    
    avg_fatigue_score = round(sum(all_scores) / len(all_scores), 4) if all_scores else 0.0
    max_fatigue_score = round(max(all_scores), 4) if all_scores else 0.0
    
    # tendance sur les 7 derniers jours
    today = datetime.utcnow().date()
    seven_days_ago = today - timedelta(days=6)
    
    fatigue_trend = []
    for i in range(7):
        day = seven_days_ago + timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        
        # scores de ce jour
        day_scores = db.query(Snapshot.fatigue_score).join(Shift).filter(
            Shift.started_at >= day_start,
            Shift.started_at <= day_end,
            Snapshot.fatigue_score.isnot(None),
        )
        
        if driver_id is not None:
            day_scores = day_scores.filter(Shift.driver_id == driver_id)
        
        day_scores = day_scores.all()
        
        if day_scores:
            avg_score = round(sum(s[0] for s in day_scores) / len(day_scores), 4)
        else:
            avg_score = 0.0
        
        fatigue_trend.append({
            "date": day.isoformat(),
            "avg_fatigue_score": avg_score,
            "snapshot_count": len(day_scores),
        })
    
    return DriverStatsResponse(
        total_shifts=total_shifts,
        total_driving_hours=round(total_driving_hours, 2),
        total_break_minutes=round(total_break_minutes, 2),
        avg_breaks_per_shift=avg_breaks_per_shift,
        avg_fatigue_score=avg_fatigue_score,
        max_fatigue_score=max_fatigue_score,
        total_fatigue_peaks=total_fatigue_peaks,
        fatigue_distribution=fatigue_distribution,
        fatigue_trend_7_days=fatigue_trend,
    )
