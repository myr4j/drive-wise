import pytest
from datetime import datetime, timedelta
from app.services.feature_engineering import (
    compute_features,
    compute_driving_and_break_metrics,
    compute_time_since_last_break,
    normalize_feature,
)
from app.models.shift import Shift, Snapshot


class TestFeatureEngineering:
    def test_shift_duration_h(self):
        shift_start = datetime(2024, 3, 23, 8, 0, 0)
        shift = Shift(started_at=shift_start, status="active")
        
        # snapshot 2 hours after shift start
        current_snapshot = Snapshot(
            shift_id=1,
            timestamp=shift_start + timedelta(hours=2),
            speed_kmh=50.0,
            latitude=48.8566,
            longitude=2.3522,
        )
        
        features = compute_features(shift, current_snapshot, [])
        
        assert features["shift_duration_h"] == 2.0
    
    def test_shift_duration_h_capped_at_12(self):
        """Test shift duration is capped at 12 hours"""
        shift_start = datetime(2024, 3, 23, 6, 0, 0)
        shift = Shift(started_at=shift_start, status="active")
        
        # snapshot 15 hours after shift start
        current_snapshot = Snapshot(
            shift_id=1,
            timestamp=shift_start + timedelta(hours=15),
            speed_kmh=50.0,
            latitude=48.8566,
            longitude=2.3522,
        )
        
        features = compute_features(shift, current_snapshot, [])
        
        assert features["shift_duration_h"] == 12.0
    
    def test_is_night(self):
        shift_start = datetime(2024, 3, 23, 2, 0, 0)  # 2 AM
        shift = Shift(started_at=shift_start, status="active")
        
        current_snapshot = Snapshot(
            shift_id=1,
            timestamp=shift_start,
            speed_kmh=50.0,
            latitude=48.8566,
            longitude=2.3522,
        )
        
        features = compute_features(shift, current_snapshot, [])
        
        assert features["is_night"] == 1
    
    def test_is_not_night(self):
        shift_start = datetime(2024, 3, 23, 10, 0, 0)  # 10 AM
        shift = Shift(started_at=shift_start, status="active")
        
        current_snapshot = Snapshot(
            shift_id=1,
            timestamp=shift_start,
            speed_kmh=50.0,
            latitude=48.8566,
            longitude=2.3522,
        )
        
        features = compute_features(shift, current_snapshot, [])
        
        assert features["is_night"] == 0
    
    def test_is_post_lunch_dip(self):
        shift_start = datetime(2024, 3, 23, 14, 0, 0)  # 2 PM
        shift = Shift(started_at=shift_start, status="active")
        
        current_snapshot = Snapshot(
            shift_id=1,
            timestamp=shift_start,
            speed_kmh=50.0,
            latitude=48.8566,
            longitude=2.3522,
        )
        
        features = compute_features(shift, current_snapshot, [])
        
        assert features["is_post_lunch_dip"] == 1
    
    def test_is_not_post_lunch_dip(self):
        shift_start = datetime(2024, 3, 23, 10, 0, 0)  # 10 AM
        shift = Shift(started_at=shift_start, status="active")
        
        current_snapshot = Snapshot(
            shift_id=1,
            timestamp=shift_start,
            speed_kmh=50.0,
            latitude=48.8566,
            longitude=2.3522,
        )
        
        features = compute_features(shift, current_snapshot, [])
        
        assert features["is_post_lunch_dip"] == 0
    
    def test_hour_sin_cos(self):
        import math
        
        # minuit
        shift_start = datetime(2024, 3, 23, 0, 0, 0)
        shift = Shift(started_at=shift_start, status="active")
        
        current_snapshot = Snapshot(
            shift_id=1,
            timestamp=shift_start,
            speed_kmh=50.0,
            latitude=48.8566,
            longitude=2.3522,
        )
        
        features = compute_features(shift, current_snapshot, [])
        
        # midnight: hour_sin ~ 0, hour_cos ~ 1
        assert abs(features["hour_sin"] - 0.0) < 0.01
        assert abs(features["hour_cos"] - 1.0) < 0.01
    
    def test_driving_detection(self):
        shift_start = datetime(2024, 3, 23, 8, 0, 0)
        shift = Shift(started_at=shift_start, status="active")
        
        # create snapshots: 1 hour driving at 50 km/h
        snapshots = []
        for i in range(12):  # every 5 minutes for 1 hour
            snapshot = Snapshot(
                shift_id=1,
                timestamp=shift_start + timedelta(minutes=i * 5),
                speed_kmh=50.0,  # driving
                latitude=48.8566,
                longitude=2.3522,
            )
            snapshots.append(snapshot)
        
        current_snapshot = snapshots[-1]
        features = compute_features(shift, current_snapshot, snapshots[:-1])
        
        # should have approximately 1 hour of driving
        assert features["active_driving_h"] >= 0.9
        assert features["driving_ratio"] >= 0.9
    
    def test_break_detection(self):
        shift_start = datetime(2024, 3, 23, 8, 0, 0)
        shift = Shift(started_at=shift_start, status="active")
        
        # create snapshots: 30 min driving, then 5 min stopped (break)
        snapshots = []
        
        # 30 minutes driving
        for i in range(6):
            snapshots.append(Snapshot(
                shift_id=1,
                timestamp=shift_start + timedelta(minutes=i * 5),
                speed_kmh=50.0,
                latitude=48.8566,
                longitude=2.3522,
            ))
        
        # 5 minutes stopped (break) 1 snapshot at speed 0
        snapshots.append(Snapshot(
            shift_id=1,
            timestamp=shift_start + timedelta(minutes=35),
            speed_kmh=0.0,
            latitude=48.8566,
            longitude=2.3522,
        ))
        
        # resume driving
        current_snapshot = Snapshot(
            shift_id=1,
            timestamp=shift_start + timedelta(minutes=40),
            speed_kmh=50.0,
            latitude=48.8566,
            longitude=2.3522,
        )
        
        features = compute_features(shift, current_snapshot, snapshots)
        
        # Should have detected 1 break
        assert features["break_count"] >= 1
    
    def test_normalize_feature(self):
        assert normalize_feature(5.0, 0, 10) == 0.5
        assert normalize_feature(0.0, 0, 10) == 0.0
        assert normalize_feature(10.0, 0, 10) == 1.0
        assert normalize_feature(120.0, 0, 240) == 0.5
    
    def test_normalize_feature_clamped(self):
        assert normalize_feature(15.0, 0, 10) == 1.0
        assert normalize_feature(-5.0, 0, 10) == 0.0
    
    def test_normalize_feature_same_min_max(self):
        assert normalize_feature(5.0, 5, 5) == 0.0


class TestComputeDrivingAndBreakMetrics:
    
    def test_empty_snapshots(self):
        driving_h, break_min, break_count = compute_driving_and_break_metrics(
            [], datetime(2024, 3, 23, 8, 0, 0)
        )
        assert driving_h == 0.0
        assert break_min == 0.0
        assert break_count == 0
    
    def test_single_snapshot(self):
        snapshots = [Snapshot(
            shift_id=1,
            timestamp=datetime(2024, 3, 23, 8, 0, 0),
            speed_kmh=50.0,
            latitude=48.8566,
            longitude=2.3522,
        )]
        
        driving_h, break_min, break_count = compute_driving_and_break_metrics(
            snapshots, datetime(2024, 3, 23, 8, 0, 0)
        )
        assert driving_h == 0.0
        assert break_min == 0.0
        assert break_count == 0


class TestTimeSinceLastBreak:
    
    def test_no_break_taken(self):
        shift_start = datetime(2024, 3, 23, 8, 0, 0)
        current_time = shift_start + timedelta(hours=2)
        
        snapshots = [
            Snapshot(
                shift_id=1,
                timestamp=shift_start,
                speed_kmh=50.0,
                latitude=48.8566,
                longitude=2.3522,
            ),
            Snapshot(
                shift_id=1,
                timestamp=current_time,
                speed_kmh=50.0,
                latitude=48.8566,
                longitude=2.3522,
            ),
        ]
        
        time_since = compute_time_since_last_break(snapshots, current_time, shift_start)
        
        # should be approximately 2 hours (120 minutes) since shift start
        assert time_since >= 119  # allow small rounding differences
    
    def test_time_since_last_break_capped(self):
        """Test time since last break is capped at 240 minutes"""
        shift_start = datetime(2024, 3, 23, 8, 0, 0)
        current_time = shift_start + timedelta(hours=6)  # 6 hours
        
        snapshots = [
            Snapshot(
                shift_id=1,
                timestamp=shift_start,
                speed_kmh=50.0,
                latitude=48.8566,
                longitude=2.3522,
            ),
        ]
        
        time_since = compute_time_since_last_break([], current_time, shift_start)
        
        # should be capped at 240 minutes
        assert time_since == 240.0
