# DriveWise - Project Context

## Project Overview

**DriveWise** is an AI-powered mobile assistant that predicts VTC driver fatigue levels in real-time from non-intrusive behavioral data, and emits caring suggestions to preserve driver health.

**What DriveWise IS:**
- A road companion that watches over the driver
- A prediction tool based on objective signals
- A suggestive advisor, never authoritative

**What DriveWise is NOT:**
- An intrusive GPS tracker
- An employer surveillance tool
- A revenue optimizer

### Architecture

```
drivewise/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── database/
│   │   │   ├── base.py          # SQLAlchemy base & DB session
│   │   │   └── init_db.py       # Database initialization
│   │   ├── models/
│   │   │   └── shift.py         # SQLAlchemy models (Shift, Snapshot)
│   │   ├── routes/
│   │   │   └── shift.py         # API endpoints
│   │   ├── schemas/
│   │   │   ├── common.py        # Shared types (FatigueLevel, Suggestion)
│   │   │   ├── shift.py         # Pydantic schemas for shift
│   │   │   └── snapshot.py      # Pydantic schemas for snapshot
│   │   └── services/            # TODO: ML predictor, SHAP explainer
│   ├── ml/
│   │   ├── data/
│   │   │   ├── generate_dataset.py  # Synthetic data generator
│   │   │   └── fatigue_dataset.csv  # Training data (10k rows)
│   │   ├── train.py             # TODO: Training pipeline
│   │   └── evaluate.py          # TODO: Metrics & comparison
│   └── requirements.txt
└── QWEN.md
```

### Key Technologies

| Component | Choice | Justification |
|-----------|--------|---------------|
| **Backend API** | FastAPI 0.115.0 | Auto OpenAPI docs, async, Pydantic validation |
| **Database** | SQLite | Zero-config, sufficient for dev/single-instance |
| **ML Model** | XGBoost | Best for tabular data, handles mixed features |
| **Interpretability** | SHAP | Per-prediction explanations for driver trust |
| **Mobile** | React Native + Expo | Cross-platform, push notifications, OTA updates |
| **Data Processing** | pandas + NumPy | Standard ML pipeline tools |
| **Evaluation** | scikit-learn | Metrics, train/test split, baselines |

## Building and Running

### Prerequisites

- Python 3.8+
- pip

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Running the Server

```bash
cd backend
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/shift/start` | Start a new driving shift |
| POST | `/shift/{shift_id}/snapshot` | Record a GPS snapshot during a shift |
| POST | `/shift/{shift_id}/end` | End a shift and get summary |
| GET | `/shift/{shift_id}/status` | Get current shift status |

### Database Initialization

The database is automatically initialized on startup via `init_db()`. Tables are created from the `Shift` and `Snapshot` models.

## Data Model

### Shift
Represents a driving session with aggregated metrics:
- `started_at`, `ended_at`: Shift timestamps
- `status`: active/completed
- `active_driving_h`, `total_break_min`, `break_count`: Aggregated metrics

### Snapshot
Real-time GPS and fatigue data points:
- GPS: `speed_kmh`, `latitude`, `longitude`
- Features: `shift_duration_h`, `time_since_last_break_min`, `is_night`, `is_post_lunch_dip`, `hour_sin/cos`
- Predictions: `fatigue_score`, `fatigue_level` (low/moderate/high/critical)

## Fatigue Scoring

The ML model predicts fatigue scores (0-1) based on:
- Shift duration (30% weight)
- Time since last break (25%)
- Night driving (15%)
- Driving ratio (10%)
- Break deficit (10%)
- Post-lunch dip (5%)
- Active driving hours (5%)

Fatigue levels are categorized by thresholds:
- **Low**: < 0.3
- **Moderate**: 0.3 - 0.6
- **High**: 0.6 - 0.8
- **Critical**: > 0.8

## Development Notes

### Current TODOs

1. **Feature Engineering Service**: The route `/shift/{shift_id}/snapshot` has a TODO to implement proper feature engineering and scoring (currently returns placeholder values)
2. **LLM Summary**: The shift end summary is hardcoded; needs LLM integration
3. **Suggestion System**: The suggestion delivery mechanism needs implementation

### Coding Conventions

- French language used in API messages and descriptions
- SQLAlchemy ORM for database operations
- Pydantic v2 for request/response validation
- Enum-based types for categorical values (`FatigueLevel`)

### Testing

No test files currently exist in the project. Consider adding pytest tests for:
- API endpoint validation
- Database operations
- Fatigue scoring logic
