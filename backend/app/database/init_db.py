from app.database.base import engine, Base
from app.models.shift import Shift, Snapshot  # noqa: F401


def init_db():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Tables creees avec succes.")
