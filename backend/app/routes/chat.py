from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chatbot import generate_chat_response


router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message", response_model=ChatResponse)
def send_message(
    payload: ChatRequest,
    driver_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Envoie un message à l'assistant et reçoit une réponse contextualisée."""
    return generate_chat_response(driver_id, payload.messages, db)
