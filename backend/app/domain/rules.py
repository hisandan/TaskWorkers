"""Reglas de negocio puras: sin HTTP, base de datos ni repositorios (ver docs/alcance/negocio.md).

Todo lo que define el resultado de una asignación vive aquí, para probarlo con tests unitarios
rápidos y con muchos casos borde.
"""

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date

from app.domain.models import Schedule, Task, Worker


# ---------------------------------------------------------------------------
# Compatibilidad de skills (RN6, RN7)
# ---------------------------------------------------------------------------


def can_take(task_skills: Iterable[str], worker_skills: Iterable[str]) -> bool:
    """True si las skills de la tarea son un subconjunto de las del trabajador."""
    raise NotImplementedError("RN6, RN7")


# ---------------------------------------------------------------------------
# Cálculo de fechas (RN12 a RN16)
# ---------------------------------------------------------------------------


def schedule(effort: int, availability: int, start: date, after: Schedule | None = None) -> Schedule:
    """Calcula en qué días hábiles se trabaja una tarea.

    - `start`: fecha de inicio pedida; si cae en fin de semana se mueve al lunes (RN13).
    - `after`: última tarea ya programada del trabajador; la nueva arranca cuando esa termina,
      usando las horas que sobran de ese día (RN15).
    """
    raise NotImplementedError("RN12, RN13, RN14, RN15, RN16")


# ---------------------------------------------------------------------------
# Auto-asignación (RN18, RN19, RN21)
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Planned:
    task: Task
    worker: Worker
    schedule: Schedule


@dataclass(frozen=True)
class AutoAssignResult:
    assigned: list[Planned]
    unassigned: list[Task]


def auto_assign(
    tasks: list[Task],
    workers: list[Worker],
    start: date,
    agendas: dict[int, Schedule] | None = None,
) -> AutoAssignResult:
    """Reparte `tasks` (ya filtradas: not-done y sin asignar) entre `workers`.

    - Candidatos: trabajadores que cumplen las skills (RN18).
    - Elige al que termina más pronto según su agenda; la agenda se actualiza en la misma corrida (RN19).
    - `agendas`: worker_id -> última tarea programada de ese trabajador.
    - Si nadie cumple las skills, la tarea va a `unassigned` (RN21).
    """
    raise NotImplementedError("RN18, RN19, RN21")
