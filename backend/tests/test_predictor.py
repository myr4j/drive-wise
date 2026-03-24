"""
tests pour le service de prédiction ML
"""
import pytest
from unittest.mock import Mock, patch
import os

from app.services.predictor import (
    load_model,
    predict_fatigue,
    get_fatigue_level,
    reset_model_cache,
)
from app.schemas.common import FatigueLevel


class TestGetFatigueLevel:
    """tests pour get_fatigue_level()"""

    def test_low_when_score_below_0_3(self):
        """score < 0.3 → low"""
        assert get_fatigue_level(0.0) == FatigueLevel.LOW
        assert get_fatigue_level(0.1) == FatigueLevel.LOW
        assert get_fatigue_level(0.29) == FatigueLevel.LOW

    def test_moderate_when_score_between_0_3_and_0_6(self):
        """0.3 <= score < 0.6 → moderate"""
        assert get_fatigue_level(0.3) == FatigueLevel.MODERATE
        assert get_fatigue_level(0.45) == FatigueLevel.MODERATE
        assert get_fatigue_level(0.59) == FatigueLevel.MODERATE

    def test_high_when_score_between_0_6_and_0_8(self):
        """0.6 <= score < 0.8 → high"""
        assert get_fatigue_level(0.6) == FatigueLevel.HIGH
        assert get_fatigue_level(0.7) == FatigueLevel.HIGH
        assert get_fatigue_level(0.79) == FatigueLevel.HIGH

    def test_critical_when_score_above_0_8(self):
        """score >= 0.8 → critical"""
        assert get_fatigue_level(0.8) == FatigueLevel.CRITICAL
        assert get_fatigue_level(0.9) == FatigueLevel.CRITICAL
        assert get_fatigue_level(1.0) == FatigueLevel.CRITICAL

    def test_boundary_values(self):
        """tests des valeurs limites exactes"""
        assert get_fatigue_level(0.3) == FatigueLevel.MODERATE  # pas low
        assert get_fatigue_level(0.6) == FatigueLevel.HIGH  # pas moderate
        assert get_fatigue_level(0.8) == FatigueLevel.CRITICAL  # pas high


class TestPredictFatigue:
    """tests pour predict_fatigue()"""

    def setup_method(self):
        """réinitialise le cache avant chaque test"""
        reset_model_cache()

    def teardown_method(self):
        """réinitialise le cache après chaque test"""
        reset_model_cache()

    @patch('app.services.predictor.joblib.load')
    def test_returns_score_between_0_and_1(self, mock_load):
        """le score doit être entre 0 et 1"""
        # mock du modèle
        mock_model = Mock()
        mock_model.predict.return_value = [0.45]
        mock_load.return_value = mock_model

        features = {
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

        score = predict_fatigue(features)

        assert 0 <= score <= 1

    @patch('app.services.predictor.joblib.load')
    def test_clips_score_above_1(self, mock_load):
        """score > 1 doit être clipé à 1"""
        mock_model = Mock()
        mock_model.predict.return_value = [1.5]  # score invalide
        mock_load.return_value = mock_model

        features = {
            "shift_duration_h": 12.0,
            "active_driving_h": 11.0,
            "time_since_last_break_min": 240.0,
            "break_count": 0,
            "total_break_min": 0.0,
            "driving_ratio": 1.0,
            "is_night": 1,
            "is_post_lunch_dip": 1,
            "hour_sin": 0.0,
            "hour_cos": 1.0,
        }

        score = predict_fatigue(features)

        assert score == 1.0

    @patch('app.services.predictor.joblib.load')
    def test_clips_score_below_0(self, mock_load):
        """score < 0 doit être clipé à 0"""
        mock_model = Mock()
        mock_model.predict.return_value = [-0.2]  # score invalide
        mock_load.return_value = mock_model

        features = {
            "shift_duration_h": 0.5,
            "active_driving_h": 0.2,
            "time_since_last_break_min": 0.0,
            "break_count": 5,
            "total_break_min": 60.0,
            "driving_ratio": 0.3,
            "is_night": 0,
            "is_post_lunch_dip": 0,
            "hour_sin": 0.0,
            "hour_cos": 1.0,
        }

        score = predict_fatigue(features)

        assert score == 0.0

    @patch('app.services.predictor.joblib.load')
    def test_rounds_to_4_decimals(self, mock_load):
        """le score doit être arrondi à 4 décimales"""
        mock_model = Mock()
        mock_model.predict.return_value = [0.123456789]
        mock_load.return_value = mock_model

        features = {
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

        score = predict_fatigue(features)

        assert score == 0.1235  # arrondi à 4 décimales

    def test_raises_file_not_found_when_model_missing(self):
        """doit lever FileNotFoundError si le modèle n'existe pas"""
        reset_model_cache()

        # sauvegarde le chemin original
        original_path = os.environ.get('MODEL_PATH_BACKUP')

        features = {
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

        # teste avec un chemin inexistant
        with patch('app.services.predictor.MODEL_PATH', '/nonexistent/path/model.joblib'):
            with pytest.raises(FileNotFoundError):
                predict_fatigue(features)


class TestLoadModel:
    """tests pour load_model()"""

    def setup_method(self):
        reset_model_cache()

    def teardown_method(self):
        reset_model_cache()

    @patch('app.services.predictor.joblib.load')
    def test_caches_model(self, mock_load):
        """le modèle doit être mis en cache"""
        mock_model = Mock()
        mock_load.return_value = mock_model

        # premier appel
        model1 = load_model()
        # deuxième appel
        model2 = load_model()

        # joblib.load ne doit être appelé qu'une fois
        mock_load.assert_called_once()
        assert model1 is model2

    @patch('app.services.predictor.os.path.exists')
    def test_raises_when_model_not_found(self, mock_exists):
        """doit lever une erreur si le modèle n'existe pas"""
        mock_exists.return_value = False

        with pytest.raises(FileNotFoundError) as exc_info:
            load_model()

        assert "Modèle ML non trouvé" in str(exc_info.value)
        assert "python ml/train.py" in str(exc_info.value)
