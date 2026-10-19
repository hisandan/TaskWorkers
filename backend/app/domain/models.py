"""Entidades del dominio: dataclasses sin dependencias de FastAPI ni SQLAlchemy."""

from dataclasses import dataclass, field
from datetime import date

from app.domain.errors import InvalidAvailability, InvalidEffort, InvalidStatus

# Las skills son etiquetas sin nivel (RN3): una lista de texto


@dataclass(kw_only=True)
class Task:
    id: int | None = None  # None hasta que se guarda
    name: str
    effort: int  # horas
    skills: list[str] = field(default_factory=list)
    status: str = "not-done"  # done | not-done

    def __post_init__(self) -> None:
        if not isinstance(self.effort, int) or self.effort < 1:  # RN1
            raise InvalidEffort(f"El esfuerzo debe ser un entero de horas mayor que 0: {self.effort}")
        if self.status not in ("done", "not-done"):  # RN2
            raise InvalidStatus(f"El estado debe ser done o not-done: {self.status}")

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

    def __post_init__(self) -> None:
        if not isinstance(self.availability, int) or not 1 <= self.availability <= 24:  # RN4
            raise InvalidAvailability(f"La disponibilidad debe ser un entero de horas entre 1 y 24: {self.availability}")

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
