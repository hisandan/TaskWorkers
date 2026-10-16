import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://taskworkers:taskworkers@localhost:5432/taskworkers",
)

engine = create_engine(DATABASE_URL)


class Base(DeclarativeBase):
    pass


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]


def init_db() -> None:
    Base.metadata.create_all(engine)


if __name__ == "__main__":
    init_db()
