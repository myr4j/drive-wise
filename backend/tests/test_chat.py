"""
Tests pour l'endpoint chatbot /chat/message.
Le client Groq est mocké pour ne jamais appeler l'API externe en test.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from app.main import app
from app.database.base import Base, get_db
from app.models.driver import Driver
from app.models.shift import Shift, Snapshot
from app.services import chatbot as chatbot_module


SQLALCHEMY_DATABASE_URL = "sqlite:///./test_chat.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_driver(db_session):
    driver = Driver(
        email="chat@example.com",
        username="chatuser",
        hashed_password=Driver.hash_password("password123"),
    )
    db_session.add(driver)
    db_session.commit()
    db_session.refresh(driver)
    return driver


@pytest.fixture
def sample_shift_with_snapshot(db_session, sample_driver):
    now = datetime.utcnow()
    shift = Shift(
        driver_id=sample_driver.id,
        started_at=now - timedelta(hours=4),
        ended_at=now - timedelta(hours=1),
        status="completed",
        active_driving_h=2.5,
        total_break_min=20.0,
        break_count=1,
    )
    db_session.add(shift)
    db_session.commit()
    db_session.refresh(shift)

    snapshot = Snapshot(
        shift_id=shift.id,
        timestamp=now - timedelta(hours=2),
        speed_kmh=70.0,
        latitude=48.8566,
        longitude=2.3522,
        fatigue_score=0.62,
        fatigue_level="high",
    )
    db_session.add(snapshot)
    db_session.commit()
    return shift


class _FakeGroqResponse:
    def __init__(self, content: str):
        self.choices = [
            type("C", (), {"message": type("M", (), {"content": content})()})()
        ]


class _FakeGroqClient:
    def __init__(self, *args, **kwargs):
        self.chat = type("Chat", (), {"completions": self})()

    def create(self, **kwargs):
        # Renvoie un message reconnaissable pour les assertions
        return _FakeGroqResponse("Réponse simulée de l'assistant.")


@pytest.fixture(autouse=True)
def mock_groq(monkeypatch):
    """Force tous les tests à utiliser le client Groq mocké."""
    monkeypatch.setattr(chatbot_module, "Groq", _FakeGroqClient)
    monkeypatch.setattr(chatbot_module, "GROQ_API_KEY", "test-key")


class TestChatEndpoint:
    def test_send_message_returns_assistant_reply(self, client, sample_driver, sample_shift_with_snapshot):
        response = client.post(
            f"/chat/message?driver_id={sample_driver.id}",
            json={"messages": [{"role": "user", "content": "Quel est mon score moyen ?"}]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "assistant"
        assert data["content"] == "Réponse simulée de l'assistant."

    def test_send_message_works_without_driver(self, client):
        response = client.post(
            "/chat/message",
            json={"messages": [{"role": "user", "content": "Bonjour"}]},
        )
        assert response.status_code == 200
        assert response.json()["content"] == "Réponse simulée de l'assistant."

    def test_empty_messages_rejected(self, client):
        response = client.post(
            "/chat/message",
            json={"messages": []},
        )
        assert response.status_code == 422

    def test_unknown_driver_does_not_crash(self, client):
        response = client.post(
            "/chat/message?driver_id=9999",
            json={"messages": [{"role": "user", "content": "Bonjour"}]},
        )
        assert response.status_code == 200
        assert response.json()["role"] == "assistant"

    def test_fallback_when_api_key_missing(self, client, sample_driver, monkeypatch):
        monkeypatch.setattr(chatbot_module, "GROQ_API_KEY", "")
        response = client.post(
            f"/chat/message?driver_id={sample_driver.id}",
            json={"messages": [{"role": "user", "content": "Hello"}]},
        )
        assert response.status_code == 200
        # Le fallback est renvoyé quand la clé est absente
        assert "indisponible" in response.json()["content"].lower()
