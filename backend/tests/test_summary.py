"""
tests pour le service de résumé de shift
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from app.services.summary import (
    generate_shift_summary,
    build_shift_summary_prompt,
    _generate_fallback_summary,
)


class TestBuildShiftSummaryPrompt:
    """tests pour build_shift_summary_prompt()"""

    def test_includes_shift_duration(self):
        """le prompt doit inclure la durée du shift"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)  # 4h

        prompt = build_shift_summary_prompt(
            shift_start=shift_start,
            shift_end=shift_end,
            total_snapshots=8,
            avg_fatigue_score=0.45,
            max_fatigue_score=0.72,
            fatigue_peaks_count=2,
            active_driving_h=3.5,
            total_break_min=25.0,
            break_count=2,
        )

        assert "4.0h" in prompt

    def test_includes_fatigue_assessment(self):
        """le prompt doit inclure l'évaluation de fatigue"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        prompt = build_shift_summary_prompt(
            shift_start=shift_start,
            shift_end=shift_end,
            total_snapshots=8,
            avg_fatigue_score=0.45,  # modérée
            max_fatigue_score=0.72,
            fatigue_peaks_count=2,
            active_driving_h=3.5,
            total_break_min=25.0,
            break_count=2,
        )

        assert "modérée" in prompt

    def test_includes_break_assessment(self):
        """le prompt doit inclure l'évaluation des pauses"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        prompt = build_shift_summary_prompt(
            shift_start=shift_start,
            shift_end=shift_end,
            total_snapshots=8,
            avg_fatigue_score=0.45,
            max_fatigue_score=0.72,
            fatigue_peaks_count=2,
            active_driving_h=3.5,
            total_break_min=25.0,
            break_count=2,
        )

        assert "pauses" in prompt.lower() or "pause" in prompt.lower()

    def test_fatigue_assessment_low(self):
        """avg < 0.3 → fatigue faible"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        prompt = build_shift_summary_prompt(
            shift_start, shift_end, 8, 0.25, 0.3, 0, 3.5, 30.0, 3
        )

        assert "faible" in prompt

    def test_fatigue_assessment_moderate(self):
        """0.3 <= avg < 0.6 → fatigue modérée"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        prompt = build_shift_summary_prompt(
            shift_start, shift_end, 8, 0.45, 0.6, 1, 3.5, 25.0, 2
        )

        assert "modérée" in prompt

    def test_fatigue_assessment_high(self):
        """0.6 <= avg < 0.8 → fatigue élevée"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        prompt = build_shift_summary_prompt(
            shift_start, shift_end, 8, 0.65, 0.8, 3, 3.5, 20.0, 2
        )

        assert "élevée" in prompt

    def test_fatigue_assessment_critical(self):
        """avg >= 0.8 → fatigue critique"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        prompt = build_shift_summary_prompt(
            shift_start, shift_end, 8, 0.85, 0.95, 5, 3.5, 15.0, 1
        )

        assert "critique" in prompt

    def test_break_assessment_none(self):
        """break_count = 0 → aucune pause"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        prompt = build_shift_summary_prompt(
            shift_start, shift_end, 8, 0.45, 0.6, 1, 4.0, 0.0, 0
        )

        assert "aucune pause" in prompt.lower()

    def test_break_assessment_insufficient(self):
        """total_break < 15 → insuffisantes"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        prompt = build_shift_summary_prompt(
            shift_start, shift_end, 8, 0.45, 0.6, 1, 3.8, 10.0, 1
        )

        assert "insuffisantes" in prompt.lower()

    def test_break_assessment_correct(self):
        """15 <= total_break < 30 → correctes"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        prompt = build_shift_summary_prompt(
            shift_start, shift_end, 8, 0.45, 0.6, 1, 3.5, 20.0, 2
        )

        assert "correctes" in prompt.lower()

    def test_break_assessment_good(self):
        """total_break >= 30 → bonnes"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        prompt = build_shift_summary_prompt(
            shift_start, shift_end, 8, 0.45, 0.6, 1, 3.0, 45.0, 3
        )

        assert "bonnes" in prompt.lower()


class TestGenerateFallbackSummary:
    """tests pour _generate_fallback_summary()"""

    def test_includes_duration(self):
        """le résumé doit inclure la durée"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        summary = _generate_fallback_summary(
            shift_start, shift_end, 0.45, 2, 25.0
        )

        assert "4.0h" in summary

    def test_fatigue_text_low(self):
        """avg < 0.3 → fatigue faible"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        summary = _generate_fallback_summary(
            shift_start, shift_end, 0.25, 2, 25.0
        )

        assert "faible" in summary.lower()

    def test_fatigue_text_moderate(self):
        """0.3 <= avg < 0.6 → fatigue modérée"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        summary = _generate_fallback_summary(
            shift_start, shift_end, 0.45, 2, 25.0
        )

        assert "modérée" in summary.lower()

    def test_fatigue_text_high(self):
        """0.6 <= avg < 0.8 → fatigue élevée"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        summary = _generate_fallback_summary(
            shift_start, shift_end, 0.65, 2, 25.0
        )

        assert "élevée" in summary.lower()

    def test_fatigue_text_critical(self):
        """avg >= 0.8 → fatigue critique"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        summary = _generate_fallback_summary(
            shift_start, shift_end, 0.85, 2, 25.0
        )

        assert "critique" in summary.lower()

    def test_break_text_with_breaks(self):
        """avec pauses → mentionne le nombre"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        summary = _generate_fallback_summary(
            shift_start, shift_end, 0.45, 3, 30.0
        )

        assert "3 pause(s)" in summary

    def test_break_text_without_breaks(self):
        """sans pauses → mentionne l'absence"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        summary = _generate_fallback_summary(
            shift_start, shift_end, 0.45, 0, 0.0
        )

        assert "aucune pause" in summary.lower()

    def test_summary_under_250_chars(self):
        """le résumé doit faire < 250 caractères"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 20, 0, 0)

        summary = _generate_fallback_summary(
            shift_start, shift_end, 0.65, 2, 25.0
        )

        assert len(summary) < 250


class TestGenerateShiftSummary:
    """tests pour generate_shift_summary()"""

    @patch('app.services.summary.GROQ_API_KEY', '')
    def test_uses_fallback_when_no_api_key(self):
        """pas de clé API → utilise fallback"""
        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        summary = generate_shift_summary(
            shift_start=shift_start,
            shift_end=shift_end,
            total_snapshots=8,
            avg_fatigue_score=0.45,
            max_fatigue_score=0.72,
            fatigue_peaks_count=2,
            active_driving_h=3.5,
            total_break_min=25.0,
            break_count=2,
        )

        assert summary is not None
        assert len(summary) > 0
        assert len(summary) < 250

    @patch('app.services.summary.GROQ_API_KEY', 'test_key')
    @patch('app.services.summary.Groq')
    def test_calls_groq_api(self, mock_groq_class):
        """avec clé API → appelle Groq"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "excellent shift ! bonnes pauses."
        mock_client.chat.completions.create.return_value = mock_response
        mock_groq_class.return_value = mock_client

        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        summary = generate_shift_summary(
            shift_start=shift_start,
            shift_end=shift_end,
            total_snapshots=8,
            avg_fatigue_score=0.45,
            max_fatigue_score=0.72,
            fatigue_peaks_count=2,
            active_driving_h=3.5,
            total_break_min=25.0,
            break_count=2,
        )

        assert mock_groq_class.called
        assert mock_client.chat.completions.create.called
        assert summary == "excellent shift ! bonnes pauses."

    @patch('app.services.summary.GROQ_API_KEY', 'test_key')
    @patch('app.services.summary.Groq')
    def test_uses_fallback_on_api_error(self, mock_groq_class):
        """erreur API → utilise fallback"""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("API error")
        mock_groq_class.return_value = mock_client

        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        summary = generate_shift_summary(
            shift_start=shift_start,
            shift_end=shift_end,
            total_snapshots=8,
            avg_fatigue_score=0.45,
            max_fatigue_score=0.72,
            fatigue_peaks_count=2,
            active_driving_h=3.5,
            total_break_min=25.0,
            break_count=2,
        )

        assert summary is not None
        assert len(summary) > 0

    @patch('app.services.summary.GROQ_API_KEY', 'test_key')
    @patch('app.services.summary.Groq')
    def test_truncates_long_summary(self, mock_groq_class):
        """résumé trop long → tronqué à 250 caractères"""
        mock_client = Mock()
        mock_response = Mock()
        long_summary = "x" * 300  # trop long
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = long_summary
        mock_client.chat.completions.create.return_value = mock_response
        mock_groq_class.return_value = mock_client

        shift_start = datetime(2024, 1, 15, 8, 0, 0)
        shift_end = datetime(2024, 1, 15, 12, 0, 0)

        summary = generate_shift_summary(
            shift_start=shift_start,
            shift_end=shift_end,
            total_snapshots=8,
            avg_fatigue_score=0.45,
            max_fatigue_score=0.72,
            fatigue_peaks_count=2,
            active_driving_h=3.5,
            total_break_min=25.0,
            break_count=2,
        )

        assert len(summary) <= 250
