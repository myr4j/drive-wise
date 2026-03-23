import os
import logging
from datetime import datetime
from typing import Optional, List

from groq import Groq
from app.schemas.common import FatigueLevel


# configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.2-3b-preview"

# logging
logger = logging.getLogger(__name__)


def build_shift_summary_prompt(
    shift_start: datetime,
    shift_end: datetime,
    total_snapshots: int,
    avg_fatigue_score: float,
    max_fatigue_score: float,
    fatigue_peaks_count: int,
    active_driving_h: float,
    total_break_min: float,
    break_count: int,
) -> str:
    duration_h = (shift_end - shift_start).total_seconds() / 3600
    
    # determine fatigue assessment
    if avg_fatigue_score < 0.3:
        fatigue_assessment = "faible"
    elif avg_fatigue_score < 0.6:
        fatigue_assessment = "modérée"
    elif avg_fatigue_score < 0.8:
        fatigue_assessment = "élevée"
    else:
        fatigue_assessment = "critique"
    
    # determine break quality
    if break_count == 0:
        break_assessment = "Aucune pause prise"
    elif total_break_min < 15:
        break_assessment = "Pauses insuffisantes"
    elif total_break_min < 30:
        break_assessment = "Pauses correctes"
    else:
        break_assessment = "Bonnes pauses régulières"
    
    prompt = f"""Tu es un assistant bienveillant pour chauffeur VTC. Génère un résumé de shift court et encourageant.

DONNÉES DU SHIFT:
- Durée: {duration_h:.1f}h ({shift_start.strftime('%H:%M')} - {shift_end.strftime('%H:%M')})
- Conduite effective: {active_driving_h:.1f}h
- Pauses: {break_count} ({total_break_min:.0f}min au total) - {break_assessment}
- Fatigue moyenne: {avg_fatigue_score:.2f} ({fatigue_assessment})
- Pic de fatigue max: {max_fatigue_score:.2f}
- Moments de fatigue élevée: {fatigue_peaks_count}

Génère un résumé qui:
- Est en français
- Fait maximum 200 caractères
- Est bienveillant et encourageant
- Mentionne un point positif du shift
- Propose une amélioration si pertinent (sans être moralisateur)
- Utilise un ton chaleureux et professionnel

Réponds UNIQUEMENT avec le résumé, rien d'autre."""

    return prompt


def generate_shift_summary(
    shift_start: datetime,
    shift_end: datetime,
    total_snapshots: int,
    avg_fatigue_score: float,
    max_fatigue_score: float,
    fatigue_peaks_count: int,
    active_driving_h: float,
    total_break_min: float,
    break_count: int,
) -> str:
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not configured, using fallback summary")
        return _generate_fallback_summary(
            shift_start, shift_end, avg_fatigue_score, break_count, total_break_min
        )
    
    try:
        # initialize Groq client
        client = Groq(api_key=GROQ_API_KEY)
        
        # build prompt
        prompt = build_shift_summary_prompt(
            shift_start, shift_end, total_snapshots,
            avg_fatigue_score, max_fatigue_score, fatigue_peaks_count,
            active_driving_h, total_break_min, break_count
        )
        
        # call LLM with timeout
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un assistant bienveillant pour chauffeurs VTC. Tu génères des résumés de shift courts (<200 caractères), en français, avec un ton chaleureux et professionnel."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=100,  # Limit to ~200 characters
            timeout=3.0,  # 3 second timeout
        )
        
        # extract summary
        summary = response.choices[0].message.content.strip()
        
        # ensure summary is not too long
        if len(summary) > 250:
            summary = summary[:247] + "..."
        
        logger.info(f"Generated shift summary: {summary}")
        
        return summary
        
    except Exception as e:
        logger.error(f"Groq API error for shift summary: {e}, using fallback")
        return _generate_fallback_summary(
            shift_start, shift_end, avg_fatigue_score, break_count, total_break_min
        )


def _generate_fallback_summary(
    shift_start: datetime,
    shift_end: datetime,
    avg_fatigue_score: float,
    break_count: int,
    total_break_min: float,
) -> str:
    duration_h = (shift_end - shift_start).total_seconds() / 3600
    
    if avg_fatigue_score < 0.3:
        fatigue_text = "Fatigue faible, bon travail !"
    elif avg_fatigue_score < 0.6:
        fatigue_text = "Fatigue modérée gérée correctement."
    elif avg_fatigue_score < 0.8:
        fatigue_text = "Fatigue élevée, pensez à vous reposer."
    else:
        fatigue_text = "Fatigue critique, repos nécessaire."
    
    if break_count > 0:
        break_text = f"{break_count} pause(s) prise(s) ({total_break_min:.0f}min)."
    else:
        break_text = "Aucune pause prise."
    
    return f"Shift de {duration_h:.1f}h terminé. {fatigue_text} {break_text}"
