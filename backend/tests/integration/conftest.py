import os
from collections.abc import Callable, Iterator
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, make_url, text
from sqlalchemy.orm import Session

from app.adapters.http.dependencies import get_clock
from app.adapters.sql.db import AssignmentRow, Base, TaskRow, WorkerRow, get_session, skill_rows
from app.main import app
from tests.dates import MON_19
from tests.fakes import FixedClock

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
    app.dependency_overrides[get_clock] = lambda: FixedClock(MON_19)
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


# Fábricas: preparan el "Dado" directo en la base, sin pasar por la API que se está probando.
# Misma firma que las de tests/application/conftest.py


@pytest.fixture
def make_task(session: Session) -> Callable[..., TaskRow]:
    def _make(name: str = "API", effort: int = 10, skills: list[str] | None = None, status: str = "not-done") -> TaskRow:
        task = TaskRow(name=name, effort=effort, skills=skill_rows(session, skills or []), status=status)
        session.add(task)
        session.flush()
        return task

    return _make


@pytest.fixture
def make_worker(session: Session) -> Callable[..., WorkerRow]:
    def _make(name: str = "Ana", availability: int = 6, skills: list[str] | None = None) -> WorkerRow:
        worker = WorkerRow(name=name, availability=availability, skills=skill_rows(session, skills or []))
        session.add(worker)
        session.flush()
        return worker

    return _make


@pytest.fixture
def make_assignment(session: Session) -> Callable[..., AssignmentRow]:
    def _make(task: TaskRow, worker: WorkerRow, start: date = MON_19) -> AssignmentRow:
        assignment = AssignmentRow(task_id=task.id, worker_id=worker.id, start_date=start)
        session.add(assignment)
        session.flush()
        return assignment

    return _make
