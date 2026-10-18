import os
from collections.abc import Iterator
from datetime import date

from sqlalchemy import ARRAY, ForeignKey, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://taskworkers:taskworkers@localhost:5432/taskworkers",
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(engine)


def get_session() -> Iterator[Session]:
    # Una transacción por request: commit al terminar, rollback si hubo error (los repositorios solo hacen flush)
    with SessionLocal() as session, session.begin():
        yield session


class Base(DeclarativeBase):
    pass


# Filas de la base. El dominio no las ve: los repositorios las mapean a app.domain.models
# Las skills son etiquetas sin nivel (RN3): se guardan como un arreglo de texto, sin tabla aparte


class TaskRow(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    effort: Mapped[int]  # horas
    skills: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    status: Mapped[str] = mapped_column(default="not-done")  # done | not-done


class WorkerRow(Base):
    __tablename__ = "workers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    availability: Mapped[int]  # horas por día hábil
    skills: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)


class AssignmentRow(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), unique=True)  # RN9: una sola vez
    worker_id: Mapped[int] = mapped_column(ForeignKey("workers.id"))
    start_date: Mapped[date]
    end_date: Mapped[date]
    # Horas trabajadas el día de fin: la siguiente tarea del trabajador usa lo que sobra (RN15)
    last_day_hours: Mapped[int]
