import numpy as np
import pandas as pd
import os

SEED = 42
np.random.seed(SEED)

N = 10_000
OUTPUT_DIR = "ml/data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "fatigue_dataset.csv")

# ============================================================
# 1. Generation des features
# ============================================================

# 500 chauffeurs, plusieurs shifts chacun
driver_ids = [f"DRV-{i:04d}" for i in np.random.randint(1, 501, size=N)]

# shift_duration_h : 0 -> 12
shift_duration_h = np.round(np.random.uniform(0.5, 12, size=N), 2)

# Heure courante du snapshot (0-23), utile pour deriver is_night, is_post_lunch_dip, hour_sin, hour_cos
current_hour = np.random.uniform(0, 24, size=N)

# is_night : 1 si heure dans [0, 6[
is_night = ((current_hour >= 0) & (current_hour < 6)).astype(int)

# is_post_lunch_dip : 1 si heure dans [13, 16[
is_post_lunch_dip = ((current_hour >= 13) & (current_hour < 16)).astype(int)

# hour_sin / hour_cos
hour_sin = np.round(np.sin(2 * np.pi * current_hour / 24), 6)
hour_cos = np.round(np.cos(2 * np.pi * current_hour / 24), 6)

# active_driving_h : entre 30% et 95% du shift
driving_fraction = np.random.uniform(0.3, 0.95, size=N)
active_driving_h = np.round(shift_duration_h * driving_fraction, 2)

# total_break_min : temps non conduit - un peu d'attente
# temps non conduit = shift - active_driving
non_driving_min = (shift_duration_h - active_driving_h) * 60
# entre 30% et 90% du temps non conduit est de la pause reelle
break_fraction = np.random.uniform(0.3, 0.9, size=N)
total_break_min = np.round(non_driving_min * break_fraction, 1)
total_break_min = np.clip(total_break_min, 0, None)

# break_count : derive du total_break_min (une pause = ~10min en moyenne)
break_count = np.where(
    total_break_min < 3,
    0,
    np.clip(np.round(total_break_min / np.random.uniform(5, 20, size=N)), 0, 25).astype(int),
)

# time_since_last_break_min
# Si 0 pauses -> time_since = shift_duration en min (capped a 240)
# Sinon -> entre 0 et 240, correle inversement au nombre de pauses
time_since_last_break_min = np.where(
    break_count == 0,
    np.clip(shift_duration_h * 60, 0, 240),
    np.clip(
        np.round(np.random.exponential(scale=60 / (break_count + 1), size=N), 1),
        0,
        240,
    ),
)

# driving_ratio
shift_duration_min = shift_duration_h * 60
driving_ratio = np.round(active_driving_h / shift_duration_h, 4)
driving_ratio = np.clip(driving_ratio, 0, 1)

# ============================================================
# 2. Calcul du fatigue_score
# ============================================================

def norm(x, lo, hi):
    return (x - lo) / (hi - lo)


# Eviter division par zero pour le terme (1 - total_break_min / shift_duration_min)
safe_shift_min = np.maximum(shift_duration_min, 1)
break_ratio_inv = 1 - (total_break_min / safe_shift_min)
break_ratio_inv = np.clip(break_ratio_inv, 0, 1)

fatigue_score = (
    0.30 * norm(shift_duration_h, 0, 12)
    + 0.25 * norm(time_since_last_break_min, 0, 240)
    + 0.15 * is_night
    + 0.10 * norm(driving_ratio, 0, 1)
    + 0.10 * break_ratio_inv
    + 0.05 * is_post_lunch_dip
    + 0.05 * norm(active_driving_h, 0, 12)
)

noise = np.random.normal(0, 0.05, size=N)
fatigue_score = np.clip(np.round(fatigue_score + noise, 4), 0, 1)

# ============================================================
# 3. Assemblage et export
# ============================================================

df = pd.DataFrame(
    {
        "driver_id": driver_ids,
        "shift_duration_h": shift_duration_h,
        "active_driving_h": active_driving_h,
        "time_since_last_break_min": time_since_last_break_min,
        "break_count": break_count,
        "total_break_min": total_break_min,
        "driving_ratio": driving_ratio,
        "is_night": is_night,
        "is_post_lunch_dip": is_post_lunch_dip,
        "hour_sin": hour_sin,
        "hour_cos": hour_cos,
        "fatigue_score": fatigue_score,
    }
)

os.makedirs(OUTPUT_DIR, exist_ok=True)
df.to_csv(OUTPUT_FILE, index=False)

# ============================================================
# 4. Resume
# ============================================================

print(f"Dataset genere : {OUTPUT_FILE}")
print(f"Lignes : {len(df)}")
print(f"Colonnes : {list(df.columns)}")
print(f"\nfatigue_score :")
print(f"  min  : {df['fatigue_score'].min():.4f}")
print(f"  max  : {df['fatigue_score'].max():.4f}")
print(f"  mean : {df['fatigue_score'].mean():.4f}")
print(f"  std  : {df['fatigue_score'].std():.4f}")
print(f"\nis_night      : {is_night.mean():.1%}")
print(f"is_post_lunch : {is_post_lunch_dip.mean():.1%}")
print(f"\nApercu :")
print(df.head(10).to_string(index=False))
