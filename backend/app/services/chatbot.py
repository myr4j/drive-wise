"""
Service chatbot — appelle Groq avec un contexte injecté
(profil conducteur + connaissances éducatives).
"""
import os
import logging
from typing import List, Optional

from groq import Groq
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.driver import Driver
from app.models.shift import Shift, Snapshot
from app.schemas.chat import ChatMessage, ChatResponse
from app.content.education import EDUCATION_CONTEXT


GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"

# Fenêtre glissante envoyée à Groq pour le multi-tour
MAX_HISTORY_MESSAGES = 10

# Nombre de shifts récents agrégés dans le contexte conducteur
RECENT_SHIFTS_LIMIT = 5

logger = logging.getLogger(__name__)


PERSONA = """Tu es l'assistant DriveWise, un compagnon bienveillant pour chauffeurs VTC et taxis. Ton rôle est d'aider le conducteur à comprendre sa fatigue et à mieux gérer son temps de conduite.

Règles strictes :
- Réponds toujours en français.
- Sois concis (2 à 4 phrases) sauf si la question demande clairement une explication détaillée.
- Tu as accès à un résumé des données récentes du conducteur (voir ci-dessous). Cite des chiffres précis quand c'est pertinent.
- Si la question sort du périmètre (santé au volant, fatigue, statistiques personnelles du conducteur, conseils de conduite), réponds gentiment que tu ne peux pas aider et redirige vers ton domaine.
- Ne donne jamais de conseils médicaux ou de diagnostic. Pour tout problème de santé sérieux, recommande de consulter un professionnel.
- N'invente jamais de chiffres. Si tu n'as pas la donnée demandée, dis-le et propose une alternative.
- Ton ton est chaleureux, professionnel, et jamais alarmiste."""

FALLBACK_MESSAGE = (
    "Désolé, je suis momentanément indisponible. Réessaie dans un instant."
)


def _format_hours(h: Optional[float]) -> str:
    if h is None:
        return "n/c"
    return f"{h:.1f}h"


def _format_minutes(m: Optional[float]) -> str:
    if m is None:
        return "n/c"
    return f"{int(round(m))}min"


def build_driver_context(driver_id: Optional[int], db: Session) -> str:
    """Compile un résumé textuel du profil du conducteur destiné au LLM."""
    if driver_id is None:
        return "Aucun profil conducteur disponible pour cette session."

    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver is None:
        return "Aucun profil conducteur disponible pour cette session."

    shifts = (
        db.query(Shift)
        .filter(Shift.driver_id == driver_id)
        .order_by(Shift.started_at.desc())
        .limit(RECENT_SHIFTS_LIMIT)
        .all()
    )

    if not shifts:
        return (
            f"Conducteur : {driver.username}.\n"
            "Aucun trajet enregistré pour l'instant — l'historique est vide."
        )

    # Agrégats sur les shifts récupérés
    completed = [s for s in shifts if s.status == "completed"]
    total_driving = sum((s.active_driving_h or 0.0) for s in completed)
    total_break = sum((s.total_break_min or 0.0) for s in completed)
    total_breaks = sum((s.break_count or 0) for s in completed)

    # Score moyen sur les snapshots des shifts récupérés
    shift_ids = [s.id for s in shifts]
    avg_fatigue = (
        db.query(func.avg(Snapshot.fatigue_score))
        .filter(Snapshot.shift_id.in_(shift_ids), Snapshot.fatigue_score.isnot(None))
        .scalar()
    )
    max_fatigue = (
        db.query(func.max(Snapshot.fatigue_score))
        .filter(Snapshot.shift_id.in_(shift_ids), Snapshot.fatigue_score.isnot(None))
        .scalar()
    )

    lines = [
        f"Conducteur : {driver.username}.",
        f"Trajets récents inclus dans l'aperçu : {len(shifts)} (terminés : {len(completed)}).",
    ]
    if completed:
        avg_duration = total_driving / len(completed) if completed else 0.0
        lines.append(
            f"Sur ces trajets terminés : {_format_hours(total_driving)} de conduite cumulée, "
            f"{_format_minutes(total_break)} de pauses pour {total_breaks} pauses au total."
        )
        lines.append(
            f"Durée moyenne par trajet terminé : {_format_hours(avg_duration)}."
        )
    if avg_fatigue is not None:
        lines.append(
            f"Score de fatigue moyen sur les snapshots récents : {avg_fatigue:.2f} "
            f"(max : {max_fatigue:.2f})."
        )

    # Détail du shift le plus récent (souvent celui sur lequel l'utilisateur s'interroge)
    last = shifts[0]
    last_lines = [
        "Dernier trajet enregistré :",
        f"- début : {last.started_at.strftime('%Y-%m-%d %H:%M')}",
        f"- statut : {last.status}",
    ]
    if last.ended_at:
        duration_h = (last.ended_at - last.started_at).total_seconds() / 3600
        last_lines.append(f"- fin : {last.ended_at.strftime('%Y-%m-%d %H:%M')} (durée {duration_h:.1f}h)")
    if last.active_driving_h is not None:
        last_lines.append(f"- conduite active : {_format_hours(last.active_driving_h)}")
    if last.total_break_min is not None:
        last_lines.append(
            f"- pauses : {_format_minutes(last.total_break_min)} sur {last.break_count or 0} pause(s)"
        )

    last_snapshot = (
        db.query(Snapshot)
        .filter(Snapshot.shift_id == last.id)
        .order_by(Snapshot.timestamp.desc())
        .first()
    )
    if last_snapshot and last_snapshot.fatigue_score is not None:
        last_lines.append(
            f"- dernier score de fatigue : {last_snapshot.fatigue_score:.2f} "
            f"({last_snapshot.fatigue_level or 'n/c'})"
        )

    lines.append("")
    lines.extend(last_lines)
    return "\n".join(lines)


def build_system_prompt(driver_context: str) -> str:
    return (
        f"{PERSONA}\n\n"
        f"{EDUCATION_CONTEXT}\n\n"
        f"# Données du conducteur connecté\n{driver_context}"
    )


def generate_chat_response(
    driver_id: Optional[int],
    history: List[ChatMessage],
    db: Session,
) -> ChatResponse:
    """Génère une réponse de l'assistant à partir de l'historique de conversation."""
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not configured, returning fallback message")
        return ChatResponse(content=FALLBACK_MESSAGE)

    # Limite l'historique aux N derniers messages (fenêtre glissante)
    trimmed = history[-MAX_HISTORY_MESSAGES:]

    driver_context = build_driver_context(driver_id, db)
    system_prompt = build_system_prompt(driver_context)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in trimmed:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.5,
            max_tokens=400,
            timeout=8.0,
        )
        content = response.choices[0].message.content.strip()
        if not content:
            content = FALLBACK_MESSAGE
        return ChatResponse(content=content)
    except Exception as e:
        logger.error(f"Groq API error in chatbot: {e}")
        return ChatResponse(content=FALLBACK_MESSAGE)
