"""
tests pour l'historique des shifts et les statistiques
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


# configuration de la base de données de test
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_shifts.db"
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


@pytest.fixture
def sample_driver(db_session):
    """crée un chauffeur de test"""
    driver = Driver(
        email="test@example.com",
        username="testdriver",
        hashed_password=Driver.hash_password("password123"),
    )
    db_session.add(driver)
    db_session.commit()
    db_session.refresh(driver)
    return driver


@pytest.fixture
def sample_shifts(db_session, sample_driver):
    """crée des shifts de test"""
    now = datetime.utcnow()
    
    shifts = [
        Shift(
            driver_id=sample_driver.id,
            started_at=now - timedelta(days=3, hours=2),
            ended_at=now - timedelta(days=3),
            status="completed",
            active_driving_h=4.0,
            total_break_min=30.0,
            break_count=2,
        ),
        Shift(
            driver_id=sample_driver.id,
            started_at=now - timedelta(days=1, hours=5),
            ended_at=now - timedelta(days=1),
            status="completed",
            active_driving_h=5.0,
            total_break_min=45.0,
            break_count=3,
        ),
    ]
    
    for shift in shifts:
        db_session.add(shift)
    
    db_session.commit()
    
    for shift in shifts:
        snapshot = Snapshot(
            shift_id=shift.id,
            timestamp=shift.started_at + timedelta(hours=1),
            speed_kmh=65.0,
            latitude=48.8566,
            longitude=2.3522,
            fatigue_score=0.45,
            fatigue_level="moderate",
        )
        db_session.add(snapshot)
    
    db_session.commit()
    
    return shifts


class TestListShifts:
    """tests pour GET /shift/s"""

    def test_list_shifts_empty(self, client):
        """liste vide quand aucun shift"""
        response = client.get("/shift/s")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["shifts"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["per_page"] == 20
        assert data["total_pages"] == 0

    def test_list_shifts_with_data(self, client, sample_shifts):
        """liste des shifts avec données"""
        response = client.get("/shift/s")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 2
        assert len(data["shifts"]) == 2

    def test_list_shifts_pagination(self, client, sample_shifts):
        """pagination fonctionnelle"""
        response = client.get("/shift/s?page=1&per_page=1")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 2
        assert len(data["shifts"]) == 1
        assert data["page"] == 1
        assert data["per_page"] == 1
        assert data["total_pages"] == 2

    def test_list_shifts_filter_by_status(self, client, sample_shifts, db_session):
        """filtre par status"""
        active_shift = Shift(
            driver_id=sample_shifts[0].driver_id,
            started_at=datetime.utcnow(),
            status="active",
        )
        db_session.add(active_shift)
        db_session.commit()
        
        response = client.get("/shift/s?status=active")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 1
        assert data["shifts"][0]["status"] == "active"


class TestDriverStats:
    """tests pour GET /shift/driver/stats"""

    def test_driver_stats_empty(self, client):
        """stats vides quand aucun shift"""
        response = client.get("/shift/driver/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_shifts"] == 0
        assert data["total_driving_hours"] == 0.0

    def test_driver_stats_with_data(self, client, sample_shifts):
        """stats avec données"""
        response = client.get("/shift/driver/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_shifts"] == 2
        assert data["total_driving_hours"] == 9.0
        assert data["total_break_minutes"] == 75.0
        assert data["avg_breaks_per_shift"] == 2.5

    def test_driver_stats_fatigue_distribution(self, client, sample_shifts):
        """distribution de fatigue"""
        response = client.get("/shift/driver/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "fatigue_distribution" in data
        assert "low" in data["fatigue_distribution"]

    def test_driver_stats_trend_7_days(self, client, sample_shifts):
        """tendance sur 7 jours"""
        response = client.get("/shift/driver/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "fatigue_trend_7_days" in data
        assert len(data["fatigue_trend_7_days"]) == 7
