import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# configuration
RANDOM_STATE = 42
TEST_SIZE = 0.2

# paths
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "saved_models",
    "xgboost_model.joblib"
)
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "fatigue_dataset.csv")

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


def load_model(model_path: str):
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model not found at {model_path}. Run 'python ml/train.py' first."
        )
    return joblib.load(model_path)


def load_and_prepare_data(data_path: str) -> tuple:
    df = pd.read_csv(data_path)
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    return X_test, y_test


def evaluate_model(model, X_test: pd.DataFrame, y_test: pd.Series, model_name: str) -> dict:
    y_pred = model.predict(X_test)
    
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    return {
        "name": model_name,
        "rmse": rmse,
        "mae": mae,
        "r2": r2,
    }


def print_metrics(metrics: dict) -> None:
    """Print evaluation metrics in a formatted way."""
    print(f"\n  Model: {metrics['name']}")
    print(f"  ─────────────────────────────")
    print(f"  RMSE: {metrics['rmse']:.4f}")
    print(f"  MAE:  {metrics['mae']:.4f}")
    print(f"  R²:   {metrics['r2']:.4f}")


def print_comparison(xgb_metrics: dict, baseline_metrics: dict) -> None:
    print("\n" + "=" * 60)
    print("Model Comparison")
    print("=" * 60)
    
    print(f"\n  {'Metric':<10} {'XGBoost':<12} {'Baseline (LR)':<15} {'Improvement':<12}")
    print(f"  {'─' * 10} {'─' * 12} {'─' * 15} {'─' * 12}")
    
    rmse_improvement = ((baseline_metrics['rmse'] - xgb_metrics['rmse']) / baseline_metrics['rmse']) * 100
    mae_improvement = ((baseline_metrics['mae'] - xgb_metrics['mae']) / baseline_metrics['mae']) * 100
    r2_improvement = ((xgb_metrics['r2'] - baseline_metrics['r2']) / baseline_metrics['r2']) * 100
    
    print(f"  {'RMSE':<10} {xgb_metrics['rmse']:<12.4f} {baseline_metrics['rmse']:<15.4f} {rmse_improvement:>+.1f}%")
    print(f"  {'MAE':<10} {xgb_metrics['mae']:<12.4f} {baseline_metrics['mae']:<15.4f} {mae_improvement:>+.1f}%")
    print(f"  {'R²':<10} {xgb_metrics['r2']:<12.4f} {baseline_metrics['r2']:<15.4f} {r2_improvement:>+.1f}%")


def print_residual_analysis(y_test: pd.Series, y_pred: np.ndarray) -> None:
    residuals = y_test - y_pred
    
    print("\n" + "=" * 60)
    print("Residual Analysis")
    print("=" * 60)
    print(f"\n  Mean residual:  {residuals.mean():.4f} (should be ~0)")
    print(f"  Std residual:   {residuals.std():.4f}")
    print(f"  Min residual:   {residuals.min():.4f}")
    print(f"  Max residual:   {residuals.max():.4f}")
    
    # check if residuals are approximately normal
    from scipy import stats
    _, p_value = stats.normaltest(residuals)
    is_normal = "Yes (p > 0.05)" if p_value > 0.05 else "No (p < 0.05)"
    print(f"  Normal dist.:   {is_normal}")


def main():
    """Main evaluation pipeline."""
    print("=" * 60)
    print("DriveWise - ML Model Evaluation")
    print("=" * 60)
    
    # load model
    print("\n[1/4] Loading trained model...")
    try:
        model = load_model(MODEL_PATH)
        print(f"      Model loaded from {MODEL_PATH}")
    except FileNotFoundError as e:
        print(f"      ERROR: {e}")
        return
    
    # load data
    print("\n[2/4] Loading test data...")
    X_test, y_test = load_and_prepare_data(DATA_PATH)
    print(f"      Test set: {len(X_test):,} samples")
    
    # evaluate XGBoost
    print("\n[3/4] Evaluating XGBoost model...")
    xgb_metrics = evaluate_model(model, X_test, y_test, "XGBoost Regressor")
    print_metrics(xgb_metrics)
    
    # train and evaluate baseline
    print("\n[4/4] Training baseline (Linear Regression) for comparison...")
    # reload training data for baseline
    df = pd.read_csv(DATA_PATH)
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    X_train, X_test_bl, y_train, y_test_bl = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    
    baseline = LinearRegression()
    baseline.fit(X_train, y_train)
    baseline_metrics = evaluate_model(baseline, X_test_bl, y_test_bl, "Linear Regression")
    print_metrics(baseline_metrics)
    
    # comparison
    print_comparison(xgb_metrics, baseline_metrics)
    
    # residual analysis
    print_residual_analysis(y_test, model.predict(X_test))
    
    # performance check
    print("\n" + "=" * 60)
    print("Performance Check")
    print("=" * 60)
    
    checks = [
        ("R² > 0.90", xgb_metrics['r2'] > 0.90),
        ("RMSE < 0.10", xgb_metrics['rmse'] < 0.10),
        ("Better than baseline", xgb_metrics['r2'] > baseline_metrics['r2']),
    ]
    
    all_passed = True
    for check_name, passed in checks:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {check_name:<20} {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("All performance checks PASSED!")
    else:
        print("Some performance checks FAILED. Review model parameters.")
    print("=" * 60)
    
    return xgb_metrics


if __name__ == "__main__":
    main()
