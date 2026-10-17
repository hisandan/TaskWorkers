import os
from collections.abc import Callable, Iterator
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, make_url, text
from sqlalchemy.orm import Session

from app.api.assignments import get_today
from app.db import Assignment, Base, Task, Worker, get_session
from app.main import app
from tests.dates import MON_19

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://taskworkers:taskworkers@localhost:5432/taskworkers_test",
)


def create_database_if_missing(url: str) -> None:
    db_url = make_url(url)
    admin = create_engine(db_url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        exists = conn.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": db_url.database},
        )
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{db_url.database}"'))
    admin.dispose()


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    create_database_if_missing(TEST_DATABASE_URL)
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def session(engine: Engine) -> Iterator[Session]:
    # Todo el test corre en una transacción que se revierte; los commit() de la app quedan como savepoints
    with engine.connect() as connection:
        transaction = connection.begin()
        with Session(bind=connection, join_transaction_mode="create_savepoint") as session:
            yield session
        transaction.rollback()


@pytest.fixture
def client(session: Session) -> Iterator[TestClient]:
    app.dependency_overrides[get_session] = lambda: session
    app.dependency_overrides[get_today] = lambda: MON_19
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def set_today() -> Callable[[date], None]:
    """Cambia el "hoy" de la app para un escenario puntual (ej. ESC-28: hoy = sáb 24)."""

    def _set(day: date) -> None:
        app.dependency_overrides[get_today] = lambda: day

    return _set


# Fábricas: preparan el "Dado" directo en la base, sin pasar por la API que se está probando


@pytest.fixture
def make_task(session: Session) -> Callable[..., Task]:
    def _make(name: str = "API", effort: int = 10, skills: list[str] | None = None, status: str = "not-done") -> Task:
        task = Task(name=name, effort=effort, skills=skills or [], status=status)
        session.add(task)
        session.flush()
        return task

    return _make


@pytest.fixture
def make_worker(session: Session) -> Callable[..., Worker]:
    def _make(name: str = "Ana", availability: int = 6, skills: list[str] | None = None) -> Worker:
        worker = Worker(name=name, availability=availability, skills=skills or [])
        session.add(worker)
        session.flush()
        return worker

    return _make


@pytest.fixture
def make_assignment(session: Session) -> Callable[..., Assignment]:
    def _make(task: Task, worker: Worker, start: date = MON_19, end: date = MON_19, last_day_hours: int = 6) -> Assignment:
        assignment = Assignment(
            task_id=task.id,
            worker_id=worker.id,
            start_date=start,
            end_date=end,
            last_day_hours=last_day_hours,
        )
        session.add(assignment)
        session.flush()
        return assignment

    return _make
