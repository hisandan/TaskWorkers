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

    @property
    def pk(self) -> int:
        """Id de una entidad ya guardada."""
        assert self.id is not None, f"{type(self).__name__} sin guardar"
        return self.id


@dataclass(kw_only=True)
class Worker:
    id: int | None = None
    name: str
    availability: int  # horas por día hábil
    skills: list[str] = field(default_factory=list)

    @property
    def pk(self) -> int:
        """Id de una entidad ya guardada."""
        assert self.id is not None, f"{type(self).__name__} sin guardar"
        return self.id


@dataclass(kw_only=True)
class Assignment:
    id: int | None = None
    task_id: int
    worker_id: int
    # Día de inicio comprometido: la tarea trabaja al menos 1 h ese día (RN25). El fin se calcula (RN26)
    start_date: date
