"""
tests pour l'authentification
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.base import Base, get_db
from app.models.driver import Driver


# configuration de la base de données de test
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """crée une nouvelle session de base de données pour chaque test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """crée un client de test avec la session de base de données"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


class TestRegister:
    """tests pour POST /auth/register"""

    def test_register_success(self, client):
        """inscription réussie"""
        response = client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "username": "testdriver",
                "password": "password123",
            },
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["email"] == "test@example.com"
        assert data["username"] == "testdriver"
        assert "id" in data
        assert "created_at" in data
        assert data["is_active"] is True

    def test_register_duplicate_email(self, client):
        """email déjà utilisé"""
        # première inscription
        client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "username": "testdriver",
                "password": "password123",
            },
        )
        
        # deuxième inscription avec même email
        response = client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "username": "otherdriver",
                "password": "password123",
            },
        )
        
        assert response.status_code == 400
        assert "déjà utilisé" in response.json()["detail"]

    def test_register_duplicate_username(self, client):
        """nom d'utilisateur déjà utilisé"""
        # première inscription
        client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "username": "testdriver",
                "password": "password123",
            },
        )
        
        # deuxième inscription avec même username
        response = client.post(
            "/auth/register",
            json={
                "email": "other@example.com",
                "username": "testdriver",
                "password": "password123",
            },
        )
        
        assert response.status_code == 400
        assert "déjà utilisé" in response.json()["detail"]

    def test_register_invalid_email(self, client):
        """email invalide"""
        response = client.post(
            "/auth/register",
            json={
                "email": "invalid-email",
                "username": "testdriver",
                "password": "password123",
            },
        )
        
        assert response.status_code == 422  # validation error

    def test_register_short_password(self, client):
        """mot de passe trop court"""
        response = client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "username": "testdriver",
                "password": "12345",  # 5 caractères (min 6)
            },
        )
        
        assert response.status_code == 422


class TestLogin:
    """tests pour POST /auth/login"""

    def test_login_success(self, client, db_session):
        """connexion réussie"""
        # crée un driver
        driver = Driver(
            email="test@example.com",
            username="testdriver",
            hashed_password=Driver.hash_password("password123"),
        )
        db_session.add(driver)
        db_session.commit()
        
        # tente de se connecter
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123",
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["driver"]["email"] == "test@example.com"
        assert data["driver"]["username"] == "testdriver"
        assert data["message"] == "connexion réussie"

    def test_login_wrong_email(self, client):
        """email incorrect"""
        response = client.post(
            "/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123",
            },
        )
        
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"]

    def test_login_wrong_password(self, client, db_session):
        """mot de passe incorrect"""
        # crée un driver
        driver = Driver(
            email="test@example.com",
            username="testdriver",
            hashed_password=Driver.hash_password("correctpassword"),
        )
        db_session.add(driver)
        db_session.commit()
        
        # tente de se connecter avec mauvais mot de passe
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword",
            },
        )
        
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"]

    def test_login_inactive_driver(self, client, db_session):
        """chauffeur désactivé"""
        # crée un driver désactivé
        driver = Driver(
            email="test@example.com",
            username="testdriver",
            hashed_password=Driver.hash_password("password123"),
            is_active=False,
        )
        db_session.add(driver)
        db_session.commit()
        
        # tente de se connecter
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123",
            },
        )
        
        assert response.status_code == 401
