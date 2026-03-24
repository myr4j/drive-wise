"""
tests pour le service de feature engineering
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock

from app.services.feature_engineering import (
    compute_features,
    compute_driving_and_break_metrics,
    compute_time_since_last_break,
    normalize_feature,
    prepare_features_for_model,
)
from app.models.shift import Snapshot


class TestComputeFeatures:
    """tests pour compute_features()"""

    def test_shift_duration_from_start(self):
        """le shift duration doit être calculé depuis le début du shift"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        current_time = datetime(2024, 1, 15, 10, 30, 0)  # 2.5h plus tard

        shift = Mock()
        shift.started_at = shift_start
        shift.snapshots = []

        snapshot = Mock()
        snapshot.timestamp = current_time
        snapshot.speed_kmh = 65.0

        features = compute_features(shift, snapshot, [])

        assert features["shift_duration_h"] == 2.5

    def test_shift_duration_capped_at_12h(self):
        """le shift duration doit être plafonné à 12h"""
        shift_start = datetime(2024, 1, 15, 6, 0, 0)
        current_time = datetime(2024, 1, 15, 20, 0, 0)  # 14h plus tard

        shift = Mock()
        shift.started_at = shift_start
        shift.snapshots = []

        snapshot = Mock()
        snapshot.timestamp = current_time
        snapshot.speed_kmh = 65.0

        features = compute_features(shift, snapshot, [])

        assert features["shift_duration_h"] == 12.0

    def test_is_night_between_0_and_6(self):
        """is_night = 1 si heure entre 0h et 6h"""
        shift = Mock()
        shift.started_at = datetime(2024, 1, 15, 22, 0, 0)
        shift.snapshots = []

        # test à 3h du matin
        snapshot = Mock()
        snapshot.timestamp = datetime(2024, 1, 16, 3, 0, 0)
        snapshot.speed_kmh = 65.0

        features = compute_features(shift, snapshot, [])
        assert features["is_night"] == 1

        # test à 7h du matin
        snapshot.timestamp = datetime(2024, 1, 16, 7, 0, 0)
        features = compute_features(shift, snapshot, [])
        assert features["is_night"] == 0

    def test_is_post_lunch_dip_between_13_and_16(self):
        """is_post_lunch_dip = 1 si heure entre 13h et 16h"""
        shift = Mock()
        shift.started_at = datetime(2024, 1, 15, 8, 0, 0)
        shift.snapshots = []

        # test à 14h (dans le creux)
        snapshot = Mock()
        snapshot.timestamp = datetime(2024, 1, 15, 14, 0, 0)
        snapshot.speed_kmh = 65.0

        features = compute_features(shift, snapshot, [])
        assert features["is_post_lunch_dip"] == 1

        # test à 12h (pas dans le creux)
        snapshot.timestamp = datetime(2024, 1, 15, 12, 0, 0)
        features = compute_features(shift, snapshot, [])
        assert features["is_post_lunch_dip"] == 0

    def test_hour_sin_cos_values(self):
        """hour_sin et hour_cos doivent être entre -1 et 1"""
        shift = Mock()
        shift.started_at = datetime(2024, 1, 15, 8, 0, 0)
        shift.snapshots = []

        for hour in range(24):
            snapshot = Mock()
            snapshot.timestamp = datetime(2024, 1, 15, hour, 0, 0)
            snapshot.speed_kmh = 65.0

            features = compute_features(shift, snapshot, [])

            assert -1 <= features["hour_sin"] <= 1
            assert -1 <= features["hour_cos"] <= 1

    def test_driving_ratio_between_0_and_1(self):
        """driving_ratio doit être entre 0 et 1"""
        shift = Mock()
        shift.started_at = datetime(2024, 1, 15, 8, 0, 0)
        shift.snapshots = []

        snapshot = Mock()
        snapshot.timestamp = datetime(2024, 1, 15, 10, 0, 0)
        snapshot.speed_kmh = 65.0

        features = compute_features(shift, snapshot, [])

        assert 0 <= features["driving_ratio"] <= 1


class TestComputeDrivingAndBreakMetrics:
    """tests pour compute_driving_and_break_metrics()"""

    def test_no_snapshots_returns_zero(self):
        """aucun snapshot → toutes les métriques à 0"""
        active_driving_h, total_break_min, break_count = compute_driving_and_break_metrics(
            [], datetime(2024, 1, 15, 8, 0, 0)
        )

        assert active_driving_h == 0.0
        assert total_break_min == 0.0
        assert break_count == 0

    def test_single_snapshot_returns_zero(self):
        """un seul snapshot → pas assez de données"""
        snapshot = Mock()
        snapshot.timestamp = datetime(2024, 1, 15, 8, 30, 0)
        snapshot.speed_kmh = 65.0

        active_driving_h, total_break_min, break_count = compute_driving_and_break_metrics(
            [snapshot], datetime(2024, 1, 15, 8, 0, 0)
        )

        assert active_driving_h == 0.0
        assert total_break_min == 0.0
        assert break_count == 0

    def test_driving_detected_when_speed_above_threshold(self):
        """vitesse > 5 km/h → conduit"""
        snapshots = [
            Mock(timestamp=datetime(2024, 1, 15, 8, 0, 0), speed_kmh=65.0),
            Mock(timestamp=datetime(2024, 1, 15, 9, 0, 0), speed_kmh=70.0),
        ]

        active_driving_h, total_break_min, break_count = compute_driving_and_break_metrics(
            snapshots, datetime(2024, 1, 15, 8, 0, 0)
        )

        assert active_driving_h == 1.0  # 1 heure de conduite

    def test_break_detected_when_speed_below_threshold(self):
        """vitesse <= 5 km/h → à l'arrêt (pause potentielle)"""
        snapshots = [
            Mock(timestamp=datetime(2024, 1, 15, 8, 0, 0), speed_kmh=65.0),
            Mock(timestamp=datetime(2024, 1, 15, 8, 30, 0), speed_kmh=0.0),
            Mock(timestamp=datetime(2024, 1, 15, 9, 0, 0), speed_kmh=0.0),
            Mock(timestamp=datetime(2024, 1, 15, 9, 30, 0), speed_kmh=65.0),
        ]

        active_driving_h, total_break_min, break_count = compute_driving_and_break_metrics(
            snapshots, datetime(2024, 1, 15, 8, 0, 0)
        )

        assert active_driving_h == 0.5  # 30 min de conduite (8h-8h30 + 9h-9h30)
        assert total_break_min >= 25  # ~30 min de pause
        assert break_count == 1

    def test_break_minimum_duration(self):
        """une pause doit durer au moins 2 min pour être comptée"""
        snapshots = [
            Mock(timestamp=datetime(2024, 1, 15, 8, 0, 0), speed_kmh=65.0),
            Mock(timestamp=datetime(2024, 1, 15, 8, 0, 30), speed_kmh=0.0),  # 30 sec d'arrêt
            Mock(timestamp=datetime(2024, 1, 15, 8, 1, 0), speed_kmh=65.0),
        ]

        active_driving_h, total_break_min, break_count = compute_driving_and_break_metrics(
            snapshots, datetime(2024, 1, 15, 8, 0, 0)
        )

        assert break_count == 0  # pause trop courte


class TestComputeTimeSinceLastBreak:
    """tests pour compute_time_since_last_break()"""

    def test_no_snapshots_returns_time_since_start(self):
        """aucun snapshot → retourne le temps depuis le début"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        current_time = datetime(2024, 1, 15, 9, 30, 0)  # 90 min plus tard

        result = compute_time_since_last_break([], current_time, shift_start)

        assert result == 90.0

    def test_no_breaks_returns_time_since_start(self):
        """aucune pause → retourne le temps depuis le début"""
        snapshots = [
            Mock(timestamp=datetime(2024, 1, 15, 8, 0, 0), speed_kmh=65.0),
            Mock(timestamp=datetime(2024, 1, 15, 9, 0, 0), speed_kmh=65.0),
        ]

        current_time = datetime(2024, 1, 15, 9, 30, 0)
        shift_start = datetime(2024, 1, 15, 8, 0, 0)

        result = compute_time_since_last_break(snapshots, current_time, shift_start)

        assert result == 90.0

    def test_returns_time_since_last_break_ended(self):
        """doit retourner le temps depuis la fin de la dernière pause"""
        snapshots = [
            Mock(timestamp=datetime(2024, 1, 15, 8, 0, 0), speed_kmh=65.0),
            Mock(timestamp=datetime(2024, 1, 15, 8, 30, 0), speed_kmh=0.0),  # début pause
            Mock(timestamp=datetime(2024, 1, 15, 9, 0, 0), speed_kmh=0.0),    # toujours pause
            Mock(timestamp=datetime(2024, 1, 15, 9, 30, 0), speed_kmh=65.0),  # reprise (fin pause)
            Mock(timestamp=datetime(2024, 1, 15, 10, 0, 0), speed_kmh=65.0),  # conduit
        ]

        current_time = datetime(2024, 1, 15, 10, 30, 0)  # 30 min après 10h
        shift_start = datetime(2024, 1, 15, 8, 0, 0)

        result = compute_time_since_last_break(snapshots, current_time, shift_start)

        # la pause s'est terminée à 9h30 (quand vitesse > 0)
        # current_time = 10h30, donc 60 min depuis la fin de pause
        assert result == 60.0

    def test_capped_at_240_minutes(self):
        """le temps depuis la dernière pause est plafonné à 240 min"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        current_time = datetime(2024, 1, 15, 14, 0, 0)  # 360 min plus tard

        result = compute_time_since_last_break([], current_time, shift_start)

        assert result == 240.0


class TestNormalizeFeature:
    """tests pour normalize_feature()"""

    def test_normalize_within_range(self):
        """normalisation d'une valeur dans l'intervalle"""
        result = normalize_feature(5.0, 0.0, 10.0)
        assert result == 0.5

    def test_normalize_at_min(self):
        """valeur au minimum → 0.0"""
        result = normalize_feature(0.0, 0.0, 10.0)
        assert result == 0.0

    def test_normalize_at_max(self):
        """valeur au maximum → 1.0"""
        result = normalize_feature(10.0, 0.0, 10.0)
        assert result == 1.0

    def test_normalize_below_min(self):
        """valeur en dessous du minimum → 0.0 (clip)"""
        result = normalize_feature(-5.0, 0.0, 10.0)
        assert result == 0.0

    def test_normalize_above_max(self):
        """valeur au dessus du maximum → 1.0 (clip)"""
        result = normalize_feature(15.0, 0.0, 10.0)
        assert result == 1.0

    def test_normalize_same_min_max(self):
        """min == max → retourne 0.0"""
        result = normalize_feature(5.0, 5.0, 5.0)
        assert result == 0.0


class TestPrepareFeaturesForModel:
    """tests pour prepare_features_for_model()"""

    def test_normalizes_all_features(self):
        """toutes les features doivent être normalisées"""
        features = {
            "shift_duration_h": 6.0,
            "active_driving_h": 5.0,
            "time_since_last_break_min": 120.0,
            "break_count": 2,
            "total_break_min": 30.0,
            "driving_ratio": 0.8,
            "is_night": 0,
            "is_post_lunch_dip": 1,
            "hour_sin": 0.5,
            "hour_cos": 0.5,
        }

        normalized = prepare_features_for_model(features)

        # vérifie que toutes les valeurs sont entre 0 et 1 (sauf hour_sin/cos qui sont déjà -1 à 1)
        assert 0 <= normalized["shift_duration_h"] <= 1
        assert 0 <= normalized["active_driving_h"] <= 1
        assert 0 <= normalized["time_since_last_break_min"] <= 1
        assert 0 <= normalized["break_count"] <= 1
        assert 0 <= normalized["total_break_min"] <= 1
        assert 0 <= normalized["driving_ratio"] <= 1
        assert normalized["is_night"] in [0, 1]
        assert normalized["is_post_lunch_dip"] in [0, 1]
        assert -1 <= normalized["hour_sin"] <= 1
        assert -1 <= normalized["hour_cos"] <= 1
