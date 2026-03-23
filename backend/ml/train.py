import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

# configuration
RANDOM_STATE = 42
TEST_SIZE = 0.2
MODEL_OUTPUT_PATH = os.path.join(
    os.path.dirname(__file__),
    "saved_models",
    "xgboost_model.joblib"
)

# features expected by the model
FEATURE_COLUMNS = [
    "shift_duration_h",
    "active_driving_h",
    "time_since_last_break_min",
    "break_count",
    "total_break_min",
    "driving_ratio",
    "is_night",
    "is_post_lunch_dip",
    "hour_sin",
    "hour_cos",
]

TARGET_COLUMN = "fatigue_score"


def load_data(data_path: str) -> pd.DataFrame:
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")
    
    df = pd.read_csv(data_path)
    
    # Validate required columns
    required_cols = FEATURE_COLUMNS + [TARGET_COLUMN]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
    
    return df


def prepare_data(df: pd.DataFrame) -> tuple:
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    return X, y


def train_model(X_train: pd.DataFrame, y_train: pd.Series) -> XGBRegressor:
    model = XGBRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        min_child_weight=1,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.01,
        reg_lambda=0.01,
        random_state=RANDOM_STATE,
        n_jobs=-1,  # use all available cores
    )
    
    model.fit(X_train, y_train)
    
    return model


def save_model(model: XGBRegressor, output_path: str) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    joblib.dump(model, output_path)
    print(f"Model saved to: {output_path}")


def get_feature_importance(model: XGBRegressor, feature_names: list) -> pd.DataFrame:
    importance_df = pd.DataFrame({
        "feature": feature_names,
        "importance": model.feature_importances_
    })
    importance_df = importance_df.sort_values("importance", ascending=False)
    return importance_df


def main():
    """Main training pipeline."""
    print("=" * 60)
    print("DriveWise - ML Training Pipeline")
    print("=" * 60)
    
    # load data
    data_path = os.path.join(os.path.dirname(__file__), "data", "fatigue_dataset.csv")
    print(f"\n[1/4] Loading data from {data_path}...")
    df = load_data(data_path)
    print(f"      Loaded {len(df):,} samples with {len(df.columns)} columns")
    
    # prepare data
    print("\n[2/4] Preparing features and target...")
    X, y = prepare_data(df)
    print(f"      Features: {X.shape[1]}, Samples: {X.shape[0]}")
    
    # split data
    print("\n[3/4] Splitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    print(f"      Train: {len(X_train):,} samples")
    print(f"      Test:  {len(X_test):,} samples")
    
    # train model
    print("\n[4/4] Training XGBoost Regressor...")
    model = train_model(X_train, y_train)
    print("      Training complete!")
    
    # save model
    print("\n[Saving model...]")
    save_model(model, MODEL_OUTPUT_PATH)
    
    # feature importance
    print("\n" + "=" * 60)
    print("Feature Importance (Top 5)")
    print("=" * 60)
    importance_df = get_feature_importance(model, FEATURE_COLUMNS)
    for _, row in importance_df.head(5).iterrows():
        bar = "█" * int(row["importance"] * 50)
        print(f"  {row['feature']:<25} {bar} {row['importance']:.4f}")
    
    print("\n" + "=" * 60)
    print("Training pipeline completed successfully!")
    print("=" * 60)
    
    return model


if __name__ == "__main__":
    main()
