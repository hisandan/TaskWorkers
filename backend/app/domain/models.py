"""Entidades del dominio: dataclasses sin dependencias de FastAPI ni SQLAlchemy."""

from dataclasses import dataclass, field
from datetime import date

# Las skills son etiquetas sin nivel (RN3): una lista de texto


@dataclass(kw_only=True)
class Task:
    id: int | None = None  # None hasta que se guarda
    name: str
    effort: int  # horas
    skills: list[str] = field(default_factory=list)
    status: str = "not-done"  # done | not-done


@dataclass(kw_only=True)
class Worker:
    id: int | None = None
    name: str
    availability: int  # horas por día hábil
    skills: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class Schedule:
    """Fechas calculadas de una tarea en la agenda de su trabajador; no se guardan (RN26)."""

    start: date
    end: date
    last_day_hours: int  # horas trabajadas el día `end`: la siguiente tarea usa lo que sobra (RN15)


@dataclass(kw_only=True)
class Assignment:
    id: int | None = None
    task_id: int
    worker_id: int
    # Día de inicio comprometido: la tarea trabaja al menos 1 h ese día (RN25). El fin se calcula (RN26)
    start_date: date
