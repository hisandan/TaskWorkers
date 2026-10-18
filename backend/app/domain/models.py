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
    start: date
    end: date
    last_day_hours: int  # horas trabajadas el día `end`


@dataclass(kw_only=True)
class Assignment:
    id: int | None = None
    task_id: int
    worker_id: int
    start_date: date
    end_date: date
    # Horas trabajadas el día de fin: la siguiente tarea del trabajador usa lo que sobra (RN15)
    last_day_hours: int

    @property
    def schedule(self) -> Schedule:
        return Schedule(start=self.start_date, end=self.end_date, last_day_hours=self.last_day_hours)
