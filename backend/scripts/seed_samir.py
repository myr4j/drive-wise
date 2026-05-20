"""
Crée (ou recrée) le compte de démo "samir" avec un historique de trajets
plausible sur les 3 dernières semaines.

Utilisation :
    cd backend
    ./venv/Scripts/python.exe -m scripts.seed_samir

Le script est idempotent : il supprime toutes les données existantes liées
au login "samir" avant de réinsérer.
"""
from __future__ import annotations

import math
import random
import sys
from datetime import datetime, timedelta
from typing import List, Tuple

from app.database.base import SessionLocal, engine
from app.database.init_db import init_db
from app.models.driver import Driver, DriverPreference
from app.models.feedback import Feedback
from app.models.shift import Break, Shift, Snapshot


USERNAME = "samir"
EMAIL = "samir@drivewise.fr"
PASSWORD = "samir1234"
SEED = 12345

# Paris (base de Samir : Gare de Lyon)
BASE_LAT = 48.8443
BASE_LON = 2.3735

SNAPSHOT_INTERVAL_MIN = 5


def _fatigue_level(score: float) -> str:
    if score < 0.3:
        return "low"
    if score < 0.6:
        return "moderate"
    if score < 0.8:
        return "high"
    return "critical"


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _delete_existing(db) -> None:
    # On nettoie par email ET username pour purger d'éventuelles anciennes versions
    existing = (
        db.query(Driver)
        .filter((Driver.email == EMAIL) | (Driver.username == USERNAME))
        .all()
    )
    for d in existing:
        db.query(Feedback).filter(Feedback.driver_id == d.id).delete()
        db.delete(d)
    if existing:
        db.commit()


def _build_driver(db) -> Driver:
    now = datetime.utcnow()
    driver = Driver(
        email=EMAIL,
        username=USERNAME,
        hashed_password=Driver.hash_password(PASSWORD),
        is_active=True,
        created_at=now - timedelta(days=120),
        updated_at=now,
        consent_at=now - timedelta(days=120),
        consent_version="1.0",
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)

    pref = DriverPreference(
        driver_id=driver.id,
        work_days="1,2,3,4,5,6",  # lun-sam
        typical_start_h=7,
        typical_end_h=19,
        revenue_goal=2400.0,
    )
    db.add(pref)
    db.commit()
    return driver


# --- Génération d'un shift --------------------------------------------------

def _plan_breaks(duration_h: float, started_at: datetime) -> List[Tuple[datetime, int]]:
    """Renvoie une liste de (instant de début, durée en min) pour les pauses du trajet."""
    breaks: List[Tuple[datetime, int]] = []
    if duration_h >= 3.5:
        # mi-shift, déjeuner ou pause détente
        offset_min = int(duration_h * 60 * random.uniform(0.35, 0.55))
        breaks.append((started_at + timedelta(minutes=offset_min), random.randint(15, 30)))
    if duration_h >= 6.5:
        offset_min = int(duration_h * 60 * random.uniform(0.7, 0.85))
        breaks.append((started_at + timedelta(minutes=offset_min), random.randint(10, 20)))
    if duration_h >= 9.0 and random.random() < 0.6:
        offset_min = int(duration_h * 60 * random.uniform(0.2, 0.3))
        breaks.append((started_at + timedelta(minutes=offset_min), random.randint(8, 15)))
    return sorted(breaks, key=lambda x: x[0])


def _make_snapshot(
    shift_id: int,
    ts: datetime,
    lat: float,
    lon: float,
    speed: float,
    shift_started_at: datetime,
    cumul_driving_s: float,
    cumul_break_s: float,
    break_count: int,
    last_break_end: datetime | None,
    fatigue_score: float,
) -> Snapshot:
    shift_duration_h = (ts - shift_started_at).total_seconds() / 3600
    active_driving_h = cumul_driving_s / 3600
    total_break_min = cumul_break_s / 60
    time_since_last_break_min = (
        (ts - last_break_end).total_seconds() / 60
        if last_break_end is not None
        else shift_duration_h * 60
    )
    time_since_last_break_min = min(time_since_last_break_min, 240.0)
    driving_ratio = active_driving_h / shift_duration_h if shift_duration_h > 0 else 0.0
    driving_ratio = _clamp(driving_ratio, 0.0, 1.0)

    hour_decimal = ts.hour + ts.minute / 60.0
    is_night = 1 if 0 <= ts.hour < 6 else 0
    is_post_lunch_dip = 1 if 13 <= ts.hour < 16 else 0
    hour_sin = round(math.sin(2 * math.pi * hour_decimal / 24), 6)
    hour_cos = round(math.cos(2 * math.pi * hour_decimal / 24), 6)

    return Snapshot(
        shift_id=shift_id,
        timestamp=ts,
        speed_kmh=round(speed, 2),
        latitude=round(lat, 6),
        longitude=round(lon, 6),
        shift_duration_h=round(shift_duration_h, 4),
        active_driving_h=round(active_driving_h, 4),
        time_since_last_break_min=round(time_since_last_break_min, 1),
        break_count=break_count,
        total_break_min=round(total_break_min, 1),
        driving_ratio=round(driving_ratio, 4),
        is_night=is_night,
        is_post_lunch_dip=is_post_lunch_dip,
        hour_sin=hour_sin,
        hour_cos=hour_cos,
        fatigue_score=round(fatigue_score, 3),
        fatigue_level=_fatigue_level(fatigue_score),
        suggestion_given=0,
    )


def _simulate_shift(db, driver: Driver, started_at: datetime, duration_h: float) -> Shift:
    ended_at = started_at + timedelta(hours=duration_h)

    shift = Shift(
        driver_id=driver.id,
        started_at=started_at,
        ended_at=ended_at,
        status="completed",
        created_at=started_at,
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)

    breaks_plan = _plan_breaks(duration_h, started_at)

    # Crée les enregistrements Break en base
    break_records: List[Break] = []
    for b_start, b_dur in breaks_plan:
        rec = Break(
            shift_id=shift.id,
            started_at=b_start,
            ended_at=b_start + timedelta(minutes=b_dur),
            source="manual" if random.random() < 0.7 else "auto",
        )
        db.add(rec)
        break_records.append(rec)
    db.commit()

    # Simulation seconde par seconde des snapshots (un par 5 min)
    total_seconds = int(duration_h * 3600)
    n_snapshots = total_seconds // (SNAPSHOT_INTERVAL_MIN * 60)

    lat, lon = BASE_LAT + random.uniform(-0.01, 0.01), BASE_LON + random.uniform(-0.01, 0.01)
    cumul_driving_s = 0.0
    cumul_break_s = 0.0
    break_count = 0
    last_break_end: datetime | None = None
    fatigue = 0.10 + random.uniform(0.0, 0.05)
    snapshots: List[Snapshot] = []

    for i in range(1, n_snapshots + 1):
        ts = started_at + timedelta(minutes=i * SNAPSHOT_INTERVAL_MIN)

        # Sommes-nous en pause à cet instant ?
        in_break = False
        active_break_end: datetime | None = None
        for b_start, b_dur in breaks_plan:
            if b_start <= ts < b_start + timedelta(minutes=b_dur):
                in_break = True
                active_break_end = b_start + timedelta(minutes=b_dur)
                break

        interval_s = SNAPSHOT_INTERVAL_MIN * 60

        if in_break:
            speed = random.uniform(0.0, 1.5)  # arrêté
            cumul_break_s += interval_s
            # La fatigue baisse pendant la pause
            fatigue -= 0.012
        else:
            # Vitesse urbaine plausible avec quelques arrêts (feux)
            if random.random() < 0.12:
                speed = random.uniform(0.0, 5.0)
            else:
                # Légère variation selon heure (plus calme la nuit)
                base = 55 if 22 <= ts.hour or ts.hour < 6 else 38
                speed = base + random.uniform(-15, 18)
                speed = _clamp(speed, 6.0, 85.0)
            cumul_driving_s += interval_s

            # Vient-on juste de finir une pause ?
            for b_start, b_dur in breaks_plan:
                b_end = b_start + timedelta(minutes=b_dur)
                if abs((ts - b_end).total_seconds()) < interval_s:
                    break_count += 1
                    last_break_end = b_end
                    fatigue -= 0.05

            # Croissance de la fatigue : durée + heure + creux post-déjeuner
            elapsed_h = (ts - started_at).total_seconds() / 3600
            increment = 0.003 + 0.001 * elapsed_h
            if 13 <= ts.hour < 16:
                increment += 0.003
            if 0 <= ts.hour < 6:
                increment += 0.005
            if ts.hour >= 21:
                increment += 0.002
            fatigue += increment + random.uniform(-0.003, 0.005)

        fatigue = _clamp(fatigue, 0.05, 0.95)

        # Promenade aléatoire géographique (mouvements ~50-200m)
        if not in_break:
            lat += random.uniform(-0.0015, 0.0015)
            lon += random.uniform(-0.0020, 0.0020)
            # On reste raisonnablement proche de Paris
            lat = _clamp(lat, 48.79, 48.91)
            lon = _clamp(lon, 2.25, 2.46)

        snap = _make_snapshot(
            shift_id=shift.id,
            ts=ts,
            lat=lat,
            lon=lon,
            speed=speed,
            shift_started_at=started_at,
            cumul_driving_s=cumul_driving_s,
            cumul_break_s=cumul_break_s,
            break_count=break_count,
            last_break_end=last_break_end,
            fatigue_score=fatigue,
        )
        snapshots.append(snap)

    db.add_all(snapshots)

    # Aggrégats sur le shift (cohérents avec ce qui est calculé en runtime)
    shift.active_driving_h = round(cumul_driving_s / 3600, 4)
    shift.total_break_min = round(cumul_break_s / 60, 1)
    shift.break_count = break_count

    db.commit()
    return shift


# --- Plan global ------------------------------------------------------------

def _generate_shift_calendar() -> List[Tuple[datetime, float]]:
    """Renvoie 16 shifts répartis sur 21 jours, plausibles pour un VTC parisien."""
    random.seed(SEED)
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    calendar: List[Tuple[datetime, float]] = []

    # 21 jours, on saute dimanches + 1 jour off par semaine
    cursor_day = now - timedelta(days=21)
    for offset in range(21):
        day = cursor_day + timedelta(days=offset)
        weekday = day.weekday()  # 0=lun, 6=dim
        if weekday == 6:  # dimanche off
            continue
        if random.random() < 0.18:  # 1 jour aléatoire off
            continue

        # Profil d'horaire : matin (60%), soir (30%), nuit (10%)
        roll = random.random()
        if roll < 0.6:
            start_hour = random.randint(6, 9)
            duration = random.choice([6.0, 7.0, 7.5, 8.0, 8.5, 9.0])
        elif roll < 0.9:
            start_hour = random.randint(16, 19)
            duration = random.choice([5.0, 6.0, 7.0, 7.5])
        else:
            start_hour = random.randint(21, 23)
            duration = random.choice([5.0, 6.5, 8.0])

        start_minute = random.choice([0, 15, 30, 45])
        started_at = day.replace(hour=start_hour, minute=start_minute, second=0, microsecond=0)

        # Ne pas créer de shifts futurs
        if started_at + timedelta(hours=duration) > now - timedelta(minutes=15):
            continue

        calendar.append((started_at, duration))

    return calendar


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        _delete_existing(db)
        driver = _build_driver(db)
        print(f"Driver créé : id={driver.id}, username={driver.username}, mdp={PASSWORD}")

        calendar = _generate_shift_calendar()
        print(f"Génération de {len(calendar)} trajets...")
        for started_at, duration in calendar:
            shift = _simulate_shift(db, driver, started_at, duration)
            n_snap = db.query(Snapshot).filter(Snapshot.shift_id == shift.id).count()
            n_brk = db.query(Break).filter(Break.shift_id == shift.id).count()
            print(
                f"  • {started_at.strftime('%Y-%m-%d %H:%M')} — {duration:.1f}h "
                f"({n_snap} snapshots, {n_brk} pause(s))"
            )

        print(f"\nDonnées prêtes : connectez-vous avec {EMAIL} / {PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
