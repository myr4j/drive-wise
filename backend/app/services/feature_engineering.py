
import math
from datetime import datetime
from typing import List, Optional

from app.models.shift import Shift, Snapshot


SPEED_MOVING_THRESHOLD = 5.0  # below this = stopped
BREAK_MIN_DURATION_MIN = 2.0  # minimum stop duration to count as break


def compute_features(
    shift: Shift,
    current_snapshot: Snapshot,
    all_snapshots: Optional[List[Snapshot]] = None
) -> dict:
    # retrieve snapshots
    if all_snapshots is None:
        all_snapshots = shift.snapshots if hasattr(shift, 'snapshots') else []
    
    # include current snapshot if not already in list
    if current_snapshot not in all_snapshots:
        all_snapshots = list(all_snapshots) + [current_snapshot]
    
    # sort by timestamp
    all_snapshots = sorted(all_snapshots, key=lambda s: s.timestamp)
    
    # current timestamp for calculations
    current_time = current_snapshot.timestamp
    
    # shift_duration_h
    shift_duration_h = (current_time - shift.started_at).total_seconds() / 3600
    shift_duration_h = min(shift_duration_h, 12.0)  # Cap at 12h
    
    # driving/break metrics from all snapshots
    active_driving_h, total_break_min, break_count = compute_driving_and_break_metrics(
        all_snapshots, shift.started_at
    )
    
    # time_since_last_break_min
    time_since_last_break_min = compute_time_since_last_break(
        all_snapshots, current_time, shift.started_at
    )
    
    # driving_ratio
    if shift_duration_h > 0:
        driving_ratio = active_driving_h / shift_duration_h
    else:
        driving_ratio = 0.0
    driving_ratio = min(max(driving_ratio, 0.0), 1.0) 
    
    # current hour for circadian features
    current_hour = current_time.hour + current_time.minute / 60.0
    
    # is_night (0-6 AM)
    is_night = 1 if 0 <= current_time.hour < 6 else 0
    
    # is_post_lunch_dip (13-16)
    is_post_lunch_dip = 1 if 13 <= current_time.hour < 16 else 0
    
    # hour_sin / hour_cos (cyclical encoding)
    hour_sin = round(math.sin(2 * math.pi * current_hour / 24), 6)
    hour_cos = round(math.cos(2 * math.pi * current_hour / 24), 6)
    
    return {
        "shift_duration_h": round(shift_duration_h, 4),
        "active_driving_h": round(active_driving_h, 4),
        "time_since_last_break_min": round(time_since_last_break_min, 1),
        "break_count": break_count,
        "total_break_min": round(total_break_min, 1),
        "driving_ratio": round(driving_ratio, 4),
        "is_night": is_night,
        "is_post_lunch_dip": is_post_lunch_dip,
        "hour_sin": hour_sin,
        "hour_cos": hour_cos,
    }


def compute_driving_and_break_metrics(
    snapshots: List[Snapshot],
    shift_start: datetime
) -> tuple:
    if len(snapshots) < 2:
        return 0.0, 0.0, 0
    
    total_driving_seconds = 0.0
    total_break_seconds = 0.0
    break_count = 0
    
    # track state
    in_break = False
    break_start_time = None
    
    prev_snapshot = snapshots[0]
    
    for i in range(1, len(snapshots)):
        current_snapshot = snapshots[i]
        
        # time interval between snapshots (in seconds)
        interval_seconds = (current_snapshot.timestamp - prev_snapshot.timestamp).total_seconds()
        
        # determine if we were driving or stopped during this interval
        # use the previous snapshot's speed as the state for the interval
        was_driving = prev_snapshot.speed_kmh > SPEED_MOVING_THRESHOLD
        
        if was_driving:
            total_driving_seconds += interval_seconds
            # if we were in a break, end it
            if in_break:
                break_duration = (prev_snapshot.timestamp - break_start_time).total_seconds() / 60.0
                if break_duration >= BREAK_MIN_DURATION_MIN:
                    total_break_seconds += break_duration * 60
                    break_count += 1
                in_break = False
                break_start_time = None
        else:
            # stopped - potentially in a break
            if not in_break:
                in_break = True
                break_start_time = prev_snapshot.timestamp
        
        prev_snapshot = current_snapshot
    
    # handle final break if still ongoing
    if in_break and break_start_time:
        break_duration = (prev_snapshot.timestamp - break_start_time).total_seconds() / 60.0
        if break_duration >= BREAK_MIN_DURATION_MIN:
            total_break_seconds += break_duration * 60
            break_count += 1
    
    # convert units
    active_driving_h = total_driving_seconds / 3600
    total_break_min = total_break_seconds / 60
    
    return active_driving_h, total_break_min, break_count


def compute_time_since_last_break(
    snapshots: List[Snapshot],
    current_time: datetime,
    shift_start: datetime
) -> float:
    if len(snapshots) < 2:
        # no snapshots, return time since shift start
        minutes_since_start = (current_time - shift_start).total_seconds() / 60
        return min(minutes_since_start, 240.0)
    
    # find the last break period
    in_break = False
    break_start_time = None
    last_break_end_time = None
    
    prev_snapshot = snapshots[0]
    
    for i in range(1, len(snapshots)):
        current_snapshot = snapshots[i]
        was_driving = prev_snapshot.speed_kmh > SPEED_MOVING_THRESHOLD
        
        if was_driving:
            if in_break:
                # break ended at prev_snapshot
                break_duration = (prev_snapshot.timestamp - break_start_time).total_seconds() / 60.0
                if break_duration >= BREAK_MIN_DURATION_MIN:
                    last_break_end_time = prev_snapshot.timestamp
                in_break = False
                break_start_time = None
        else:
            if not in_break:
                in_break = True
                break_start_time = prev_snapshot.timestamp
        
        prev_snapshot = current_snapshot
    
    # if currently in a break, it hasn't ended yet
    if last_break_end_time:
        minutes_since_break = (current_time - last_break_end_time).total_seconds() / 60
        return min(minutes_since_break, 240.0)
    else:
        # no break taken, return time since shift start
        minutes_since_start = (current_time - shift_start).total_seconds() / 60
        return min(minutes_since_start, 240.0)


def normalize_feature(value: float, min_val: float, max_val: float) -> float:
    if max_val == min_val:
        return 0.0
    normalized = (value - min_val) / (max_val - min_val)
    return max(0.0, min(1.0, normalized))


def prepare_features_for_model(features: dict) -> dict:
    normalized = {
        "shift_duration_h": normalize_feature(features["shift_duration_h"], 0, 12),
        "active_driving_h": normalize_feature(features["active_driving_h"], 0, 12),
        "time_since_last_break_min": normalize_feature(features["time_since_last_break_min"], 0, 240),
        "break_count": normalize_feature(features["break_count"], 0, 25),
        "total_break_min": normalize_feature(features["total_break_min"], 0, features["shift_duration_h"] * 60) if features["shift_duration_h"] > 0 else 0,
        "driving_ratio": features["driving_ratio"],
        "is_night": features["is_night"], 
        "is_post_lunch_dip": features["is_post_lunch_dip"], 
        "hour_sin": features["hour_sin"], 
        "hour_cos": features["hour_cos"], 
    }
    
    return normalized
