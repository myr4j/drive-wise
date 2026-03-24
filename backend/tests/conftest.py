"""
configuration pytest pour les tests
"""
import pytest
import sys
import os

# ajoute le dossier backend au path pour les imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


@pytest.fixture
def sample_features():
    """features ML complètes pour les tests"""
    return {
        "shift_duration_h": 4.0,
        "active_driving_h": 3.5,
        "time_since_last_break_min": 90.0,
        "break_count": 1,
        "total_break_min": 15.0,
        "driving_ratio": 0.85,
        "is_night": 0,
        "is_post_lunch_dip": 1,
        "hour_sin": 0.5,
        "hour_cos": 0.5,
    }


@pytest.fixture
def sample_shift():
    """objet shift mocké pour les tests"""
    from unittest.mock import Mock
    from datetime import datetime, timedelta

    shift = Mock()
    shift.id = 1
    shift.started_at = datetime.utcnow() - timedelta(hours=4)
    shift.ended_at = None
    shift.status = "active"
    shift.active_driving_h = None
    shift.total_break_min = None
    shift.break_count = None
    shift.last_suggestion_time = None
    shift.last_fatigue_level = None
    shift.snapshots = []

    return shift


@pytest.fixture
def sample_snapshot():
    """objet snapshot mocké pour les tests"""
    from unittest.mock import Mock
    from datetime import datetime

    snapshot = Mock()
    snapshot.id = 1
    snapshot.shift_id = 1
    snapshot.timestamp = datetime.utcnow()
    snapshot.speed_kmh = 65.0
    snapshot.latitude = 48.8566
    snapshot.longitude = 2.3522
    snapshot.shift_duration_h = None
    snapshot.active_driving_h = None
    snapshot.time_since_last_break_min = None
    snapshot.break_count = None
    snapshot.total_break_min = None
    snapshot.driving_ratio = None
    snapshot.is_night = None
    snapshot.is_post_lunch_dip = None
    snapshot.hour_sin = None
    snapshot.hour_cos = None
    snapshot.fatigue_score = None
    snapshot.fatigue_level = None
    snapshot.suggestion_given = None
    snapshot.suggestion_message = None
    snapshot.suggestion_delivery = None

    return snapshot
