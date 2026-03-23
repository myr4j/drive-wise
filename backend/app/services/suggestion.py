import os
import logging
from datetime import datetime, timedelta
from typing import Optional

from groq import Groq
from app.schemas.common import FatigueLevel, Suggestion


# config
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.2-3b-preview"

# logging
logger = logging.getLogger(__name__)

# Cooldown entre les suggestions (en minutes)
SUGGESTION_COOLDOWN_MIN = 30


# Predefined fallback messages (used if API fails)
FALLBACK_MESSAGES = {
    FatigueLevel.LOW: "Conduite normale. Continuez à faire des pauses régulières.",
    FatigueLevel.MODERATE: "Fatigue modérée détectée. Une courte pause serait bénéfique.",
    FatigueLevel.HIGH: "Fatigue élevée. Pause recommandée dès que possible (15 min).",
    FatigueLevel.CRITICAL: "⚠️ Fatigue critique ! Arrêtez-vous immédiatement pour votre sécurité.",
}


# Ordre des niveaux de fatigue (pour détecter l'escalation)
FATIGUE_LEVEL_ORDER = ["low", "moderate", "high", "critical"]


def get_delivery_channel(fatigue_score: float) -> str:
    if fatigue_score < 0.3:
        return "none"
    elif fatigue_score < 0.6:
        return "in_app"
    elif fatigue_score < 0.8:
        return "push_soft"
    else:
        return "push_strong"


def should_generate_suggestion(
    fatigue_level: FatigueLevel,
    last_suggestion_time: Optional[datetime],
    last_fatigue_level: Optional[str],
) -> bool:
    """
    Décide si on doit générer une notification pour éviter de harceler le conducteur.
    
    Règles:
    1. Jamais si fatigue = low (< 0.3)
    2. Toujours si ESCALATION (on monte d'un niveau)
    3. Sinon, cooldown de 30 minutes
    
    Args:
        fatigue_level: Niveau actuel de fatigue
        last_suggestion_time: Date de la dernière suggestion (None si aucune)
        last_fatigue_level: Niveau de fatigue de la dernière suggestion (None si aucune)
    
    Returns:
        True si on doit générer une suggestion, False sinon
    """
    # 1. Pas de notification si fatigue faible
    if fatigue_level == FatigueLevel.LOW:
        return False
    
    # 2. ESCALATION = notification immédiate (ignore cooldown)
    if last_fatigue_level:
        try:
            current_idx = FATIGUE_LEVEL_ORDER.index(fatigue_level.value)
            last_idx = FATIGUE_LEVEL_ORDER.index(last_fatigue_level)
            
            if current_idx > last_idx:  # On monte d'un niveau
                logger.info(f"Escalation détectée: {last_fatigue_level} → {fatigue_level.value}")
                return True
        except ValueError:
            # Niveau invalide, on continue avec la logique normale
            pass
    
    # 3. Première suggestion du shift → on notifie
    if last_suggestion_time is None:
        return True
    
    # 4. Cooldown de 30 minutes
    minutes_since_last = (datetime.utcnow() - last_suggestion_time).total_seconds() / 60
    if minutes_since_last < SUGGESTION_COOLDOWN_MIN:
        logger.debug(f"Cooldown actif: {minutes_since_last:.1f}min < {SUGGESTION_COOLDOWN_MIN}min")
        return False
    
    # 5. Cooldown écoulé → on notifie
    logger.info(f"Cooldown écoulé: {minutes_since_last:.1f}min >= {SUGGESTION_COOLDOWN_MIN}min")
    return True


def build_prompt(
    fatigue_score: float,
    fatigue_level: FatigueLevel,
    features: dict
) -> str:
   
    shift_duration = features.get("shift_duration_h", 0)
    time_since_break = features.get("time_since_last_break_min", 0)
    hour_sin = features.get("hour_sin", 0)
    is_night = features.get("is_night", 0)
    is_post_lunch = features.get("is_post_lunch_dip", 0)
    
    # estimate hour from hour_sin (approximate)
    # hour_sin = sin(2π * hour / 24), so hour ≈ arcsin(hour_sin) * 24 / 2π
    import math
    hour_approx = int((math.asin(hour_sin) + math.pi) * 24 / (2 * math.pi)) if hour_sin else 12
    
    # build context
    context_parts = [
        f"Score de fatigue: {fatigue_score:.2f} ({fatigue_level.value.upper()})",
        f"Durée du shift: {shift_duration:.1f}h",
        f"Temps depuis dernière pause: {int(time_since_break)}min",
        f"Heure approximative: {hour_approx}h",
    ]
    
    if is_night:
        context_parts.append("Conduite de nuit (0h-6h)")
    if is_post_lunch:
        context_parts.append("Creux post-déjeuner (13h-16h)")
    
    context = " | ".join(context_parts)
    
    prompt = f"""Tu es un assistant bienveillant pour chauffeur VTC. Ton rôle est de protéger leur santé avec des conseils courts et empathiques.

CONTEXTE: {context}

Génère un conseil de fatigue qui:
- Est en français
- Fait maximum 120 caractères
- Est bienveillant, pas alarmiste (sauf fatigue critique)
- Propose une action concrète si pertinent (pause, s'hydrater, s'aérer...)
- Utilise un ton chaleureux et professionnel

Réponds UNIQUEMENT avec le message, rien d'autre."""

    return prompt


def generate_suggestion(
    fatigue_score: float,
    fatigue_level: FatigueLevel,
    features: dict
) -> Optional[Suggestion]:

    # no suggestion needed for low fatigue
    if fatigue_score < 0.3:
        return None
    
    delivery = get_delivery_channel(fatigue_score)
    
    # check if API key is configured
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not configured, using fallback message")
        return Suggestion(
            fatigue_level=fatigue_level,
            message=FALLBACK_MESSAGES[fatigue_level],
            delivery=delivery,
        )
    
    try:
        # initialize Groq client
        client = Groq(api_key=GROQ_API_KEY)
        
        # build prompt
        prompt = build_prompt(fatigue_score, fatigue_level, features)
        
        # call LLM with timeout
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un assistant bienveillant pour chauffeurs VTC. Tu génères des conseils courts (<120 caractères), en français, avec un ton chaleureux et professionnel."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=60,  # limit to ~120 characters
            timeout=2.0,  # 2 second timeout
        )
        
        # extract message
        message = response.choices[0].message.content.strip()
        
        # ensure message is not too long
        if len(message) > 150:
            message = message[:147] + "..."
        
        logger.info(f"Generated suggestion: {message}")
        
        return Suggestion(
            fatigue_level=fatigue_level,
            message=message,
            delivery=delivery,
        )
        
    except Exception as e:
        logger.error(f"Groq API error: {e}, using fallback message")
        # return fallback message on error
        return Suggestion(
            fatigue_level=fatigue_level,
            message=FALLBACK_MESSAGES[fatigue_level],
            delivery=delivery,
        )
