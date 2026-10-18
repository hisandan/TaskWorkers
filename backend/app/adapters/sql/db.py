import os
from collections.abc import Iterator
from datetime import date

from sqlalchemy import Column, ForeignKey, Table, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker

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
# Las skills son etiquetas sin nivel (RN3) en una tabla propia, para cruzar tareas y trabajadores por skill


task_skills = Table(
    "task_skills",
    Base.metadata,
    Column("task_id", ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", ForeignKey("skills.id"), primary_key=True),
)

worker_skills = Table(
    "worker_skills",
    Base.metadata,
    Column("worker_id", ForeignKey("workers.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", ForeignKey("skills.id"), primary_key=True),
)


class SkillRow(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)


class TaskRow(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    effort: Mapped[int]  # horas
    skills: Mapped[list[SkillRow]] = relationship(secondary=task_skills)
    status: Mapped[str] = mapped_column(default="not-done")  # done | not-done


class WorkerRow(Base):
    __tablename__ = "workers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    availability: Mapped[int]  # horas por día hábil
    skills: Mapped[list[SkillRow]] = relationship(secondary=worker_skills)


class AssignmentRow(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), unique=True)  # RN9: una sola vez
    worker_id: Mapped[int] = mapped_column(ForeignKey("workers.id"))
    # Solo el día de inicio comprometido (RN25); las fechas de fin se calculan (RN26)
    start_date: Mapped[date]


def skill_rows(session: Session, names: list[str]) -> list[SkillRow]:
    """Busca las skills por nombre y crea las que falten."""
    existing = {s.name: s for s in session.scalars(select(SkillRow).where(SkillRow.name.in_(names)))}
    for name in names:
        if name not in existing:
            existing[name] = SkillRow(name=name)  # se guarda en cascada con la tarea o el trabajador
    return [existing[name] for name in dict.fromkeys(names)]  # sin repetidos, en el orden recibido
