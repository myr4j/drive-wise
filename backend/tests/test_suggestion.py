"""
tests pour le service de suggestions avec logique anti-harcèlement
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from app.services.suggestion import (
    should_generate_suggestion,
    get_delivery_channel,
    generate_suggestion,
    FALLBACK_MESSAGES,
    SUGGESTION_COOLDOWN_MIN,
)
from app.schemas.common import FatigueLevel


class TestShouldGenerateSuggestion:
    """tests pour should_generate_suggestion()"""

    def test_never_for_low_fatigue(self):
        """jamais de suggestion si fatigue = low"""
        assert should_generate_suggestion(FatigueLevel.LOW, None, None) is False
        assert should_generate_suggestion(FatigueLevel.LOW, datetime.utcnow(), "low") is False

    def test_first_suggestion_for_moderate(self):
        """première suggestion pour moderate → oui"""
        result = should_generate_suggestion(FatigueLevel.MODERATE, None, None)
        assert result is True

    def test_first_suggestion_for_high(self):
        """première suggestion pour high → oui"""
        result = should_generate_suggestion(FatigueLevel.HIGH, None, None)
        assert result is True

    def test_first_suggestion_for_critical(self):
        """première suggestion pour critical → oui"""
        result = should_generate_suggestion(FatigueLevel.CRITICAL, None, None)
        assert result is True

    def test_cooldown_active_for_same_level(self):
        """cooldown actif si même niveau et < 30 min"""
        now = datetime.utcnow()
        last_time = now - timedelta(minutes=15)  # 15 min ago

        result = should_generate_suggestion(FatigueLevel.MODERATE, last_time, "moderate")
        assert result is False

    def test_cooldown_expired_for_same_level(self):
        """cooldown écoulé si même niveau et >= 30 min"""
        now = datetime.utcnow()
        last_time = now - timedelta(minutes=45)  # 45 min ago

        result = should_generate_suggestion(FatigueLevel.MODERATE, last_time, "moderate")
        assert result is True

    def test_escalation_moderate_to_high(self):
        """escalation moderate → high → notification immédiate"""
        now = datetime.utcnow()
        last_time = now - timedelta(minutes=5)  # 5 min ago (dans le cooldown)

        result = should_generate_suggestion(FatigueLevel.HIGH, last_time, "moderate")
        assert result is True  # ignore le cooldown

    def test_escalation_high_to_critical(self):
        """escalation high → critical → notification immédiate"""
        now = datetime.utcnow()
        last_time = now - timedelta(minutes=10)  # 10 min ago

        result = should_generate_suggestion(FatigueLevel.CRITICAL, last_time, "high")
        assert result is True

    def test_escalation_low_to_moderate(self):
        """escalation low → moderate → notification"""
        now = datetime.utcnow()
        last_time = now - timedelta(minutes=5)

        # low ne génère pas de suggestion, donc last_fatigue_level = low signifie pas de notif précédente
        # mais si on passe à moderate, c'est une escalation
        result = should_generate_suggestion(FatigueLevel.MODERATE, last_time, "low")
        assert result is True

    def test_decrease_high_to_moderate_with_cooldown(self):
        """diminution high → moderate avec cooldown écoulé → oui"""
        now = datetime.utcnow()
        last_time = now - timedelta(minutes=45)

        result = should_generate_suggestion(FatigueLevel.MODERATE, last_time, "high")
        assert result is True  # cooldown écoulé

    def test_decrease_high_to_moderate_with_active_cooldown(self):
        """diminution high → moderate avec cooldown actif → non"""
        now = datetime.utcnow()
        last_time = now - timedelta(minutes=15)

        result = should_generate_suggestion(FatigueLevel.MODERATE, last_time, "high")
        assert result is False  # cooldown actif, pas d'escalation

    def test_cooldown_boundary_at_30_minutes(self):
        """cooldown à la limite exacte (30 min)"""
        now = datetime.utcnow()
        last_time = now - timedelta(minutes=30)

        result = should_generate_suggestion(FatigueLevel.MODERATE, last_time, "moderate")
        assert result is True  # 30 min = cooldown écoulé

    def test_cooldown_boundary_at_29_minutes(self):
        """cooldown à 29 min"""
        now = datetime.utcnow()
        last_time = now - timedelta(minutes=29, seconds=59)

        result = should_generate_suggestion(FatigueLevel.MODERATE, last_time, "moderate")
        assert result is False  # < 30 min


class TestGetDeliveryChannel:
    """tests pour get_delivery_channel()"""

    def test_none_for_low_fatigue(self):
        """score < 0.3 → none"""
        assert get_delivery_channel(0.0) == "none"
        assert get_delivery_channel(0.29) == "none"

    def test_in_app_for_moderate_fatigue(self):
        """0.3 <= score < 0.6 → in_app"""
        assert get_delivery_channel(0.3) == "in_app"
        assert get_delivery_channel(0.45) == "in_app"
        assert get_delivery_channel(0.59) == "in_app"

    def test_push_soft_for_high_fatigue(self):
        """0.6 <= score < 0.8 → push_soft"""
        assert get_delivery_channel(0.6) == "push_soft"
        assert get_delivery_channel(0.7) == "push_soft"
        assert get_delivery_channel(0.79) == "push_soft"

    def test_push_strong_for_critical_fatigue(self):
        """score >= 0.8 → push_strong"""
        assert get_delivery_channel(0.8) == "push_strong"
        assert get_delivery_channel(0.9) == "push_strong"
        assert get_delivery_channel(1.0) == "push_strong"

    def test_boundary_values(self):
        """tests des valeurs limites"""
        assert get_delivery_channel(0.3) == "in_app"  # pas none
        assert get_delivery_channel(0.6) == "push_soft"  # pas in_app
        assert get_delivery_channel(0.8) == "push_strong"  # pas push_soft


class TestGenerateSuggestion:
    """tests pour generate_suggestion()"""

    def test_returns_none_for_low_fatigue(self):
        """fatigue low → pas de suggestion"""
        features = {
            "shift_duration_h": 1.0,
            "active_driving_h": 0.8,
            "time_since_last_break_min": 30.0,
            "break_count": 1,
            "total_break_min": 10.0,
            "driving_ratio": 0.8,
            "is_night": 0,
            "is_post_lunch_dip": 0,
            "hour_sin": 0.5,
            "hour_cos": 0.5,
        }

        result = generate_suggestion(0.2, FatigueLevel.LOW, features)
        assert result is None

    @patch('app.services.suggestion.GROQ_API_KEY', '')
    def test_uses_fallback_when_no_api_key(self):
        """pas de clé API → utilise les messages de fallback"""
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

        result = generate_suggestion(0.45, FatigueLevel.MODERATE, features)

        assert result is not None
        assert result.fatigue_level == FatigueLevel.MODERATE
        assert result.message == FALLBACK_MESSAGES[FatigueLevel.MODERATE]
        assert result.delivery == "in_app"

    @patch('app.services.suggestion.GROQ_API_KEY', 'test_key')
    @patch('app.services.suggestion.Groq')
    def test_calls_groq_api(self, mock_groq_class):
        """avec clé API → appelle Groq"""
        # mock de la réponse
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "pause conseillée !"
        mock_client.chat.completions.create.return_value = mock_response
        mock_groq_class.return_value = mock_client

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

        result = generate_suggestion(0.45, FatigueLevel.MODERATE, features)

        assert mock_groq_class.called
        assert mock_client.chat.completions.create.called
        assert result is not None
        assert result.message == "pause conseillée !"

    @patch('app.services.suggestion.GROQ_API_KEY', 'test_key')
    @patch('app.services.suggestion.Groq')
    def test_uses_fallback_on_api_error(self, mock_groq_class):
        """erreur API → utilise fallback"""
        # mock qui lève une exception
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("API error")
        mock_groq_class.return_value = mock_client

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

        result = generate_suggestion(0.45, FatigueLevel.MODERATE, features)

        assert result is not None
        assert result.message == FALLBACK_MESSAGES[FatigueLevel.MODERATE]

    @patch('app.services.suggestion.GROQ_API_KEY', 'test_key')
    @patch('app.services.suggestion.Groq')
    def test_truncates_long_messages(self, mock_groq_class):
        """message trop long → tronqué à 150 caractères"""
        mock_client = Mock()
        mock_response = Mock()
        long_message = "x" * 200  # message trop long
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = long_message
        mock_client.chat.completions.create.return_value = mock_response
        mock_groq_class.return_value = mock_client

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

        result = generate_suggestion(0.45, FatigueLevel.MODERATE, features)

        assert len(result.message) <= 150


class TestFallbackMessages:
    """tests pour les messages de fallback"""

    def test_fallback_for_low(self):
        """message de fallback pour low"""
        assert "pauses régulières" in FALLBACK_MESSAGES[FatigueLevel.LOW].lower()

    def test_fallback_for_moderate(self):
        """message de fallback pour moderate"""
        assert "pause" in FALLBACK_MESSAGES[FatigueLevel.MODERATE].lower()

    def test_fallback_for_high(self):
        """message de fallback pour high"""
        assert "pause" in FALLBACK_MESSAGES[FatigueLevel.HIGH].lower()
        assert "recommandée" in FALLBACK_MESSAGES[FatigueLevel.HIGH].lower()

    def test_fallback_for_critical(self):
        """message de fallback pour critical"""
        assert "⚠️" in FALLBACK_MESSAGES[FatigueLevel.CRITICAL]
        assert "immédiatement" in FALLBACK_MESSAGES[FatigueLevel.CRITICAL].lower()

    def test_all_messages_under_150_chars(self):
        """tous les messages doivent faire < 150 caractères"""
        for level, message in FALLBACK_MESSAGES.items():
            assert len(message) < 150, f"message {level} trop long: {len(message)} chars"
