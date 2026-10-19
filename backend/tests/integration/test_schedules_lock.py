from sqlalchemy import Engine, text
from sqlalchemy.orm import Session

from app.adapters.sql.repositories import SCHEDULES_LOCK, SqlAssignmentRepository

# Dos requests que validan agendas no pueden correr a la vez: el segundo espera al commit del primero


def try_lock(engine: Engine) -> bool:
    with engine.connect() as other:
        return other.scalar(text("SELECT pg_try_advisory_xact_lock(:key)"), {"key": SCHEDULES_LOCK})


def test_lock_schedules_blocks_other_transactions_until_it_ends(engine: Engine, session: Session) -> None:
    assert try_lock(engine)  # libre: la otra conexión lo toma y lo suelta al cerrar

    SqlAssignmentRepository(session).lock_schedules()

    assert not try_lock(engine)
