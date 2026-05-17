from sqlalchemy import text
from app.database.base import engine, Base
from app.models.shift import Shift, Snapshot, Break  # noqa: F401
from app.models.driver import Driver, DriverPreference  # noqa: F401
from app.models.feedback import Feedback  # noqa: F401


def _run_migrations():
    """Ajoute les colonnes manquantes sur les tables existantes (SQLite ne supporte pas ALTER TABLE automatique)."""
    migrations = [
        "ALTER TABLE drivers ADD COLUMN consent_at DATETIME",
        "ALTER TABLE drivers ADD COLUMN consent_version VARCHAR(20)",
        "ALTER TABLE snapshots ADD COLUMN suggestion_rating INTEGER",
    ]
    with engine.connect() as conn:
        for stmt in migrations:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                # La colonne existe déjà — on ignore
                pass


def init_db():
    Base.metadata.create_all(bind=engine)
    _run_migrations()


if __name__ == "__main__":
    init_db()
    print("Tables creees avec succes.")
