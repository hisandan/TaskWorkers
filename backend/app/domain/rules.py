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
      usando las horas que sobran de ese día (RN15). Si `after` termina antes de `start`, no
      le quita horas (RN20).
    """
    raise NotImplementedError("RN12, RN13, RN14, RN15, RN16")


# ---------------------------------------------------------------------------
# Agenda de un trabajador (RN15, RN25, RN26)
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Slot:
    """Una tarea en la agenda de un trabajador, tal como se guarda: solo su día de inicio."""

    task_id: int
    effort: int
    start: date  # día de inicio comprometido (RN25)


def agenda(slots: list[Slot], availability: int) -> dict[int, Schedule]:
    """Recorre la agenda y calcula las fechas de cada tarea (RN26): task_id -> Schedule.

    - Orden: por `start`; si coinciden, el orden de `slots` (el de asignación) desempata (RN15).
    - Cada tarea arranca en su `start` o, si el día ya está lleno, cuando termina la anterior.
    """
    raise NotImplementedError("RN15, RN26")


def late_starts(slots: list[Slot], availability: int) -> list[int]:
    """task_id de las tareas que no trabajan ninguna hora en su día de inicio (RN25)."""
    raise NotImplementedError("RN25")


# ---------------------------------------------------------------------------
# Auto-asignación (RN18, RN19, RN21, RN27, RN28)
# ---------------------------------------------------------------------------

# Estrategia v1, provisional: para cambiar el algoritmo basta con cambiar estas dos funciones


def task_priority(task: Task, candidates: list[Worker]) -> tuple:
    """Orden en que se recorren las tareas: menor primero (RN27).

    v1: primero la que tiene menos candidatos (most-constrained-first); si empatan, menor id.
    """
    return (len(candidates), task.id)


def worker_priority(worker: Worker, planned: Schedule) -> tuple:
    """Qué candidato recibe la tarea: menor primero (RN19, RN28).

    v1: el que la termina más pronto; si empatan, menor id.
    """
    return (planned.end, worker.id)


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
    - Recorre las tareas según `task_priority` (RN27).
    - Elige al candidato según `worker_priority`: el que termina más pronto según su agenda (RN19)
      y, si empatan, el desempate de RN28. La agenda se actualiza en la misma corrida.
    - `agendas`: worker_id -> última tarea programada de ese trabajador; las nuevas van al final.
    - Si nadie cumple las skills, la tarea va a `unassigned` (RN21).
    """
    last: dict[int | None, Schedule] = dict(agendas or {})  # copia: la corrida no modifica la agenda recibida
    pending = [(task, [w for w in workers if can_take(task.skills, w.skills)]) for task in tasks]
    pending.sort(key=lambda pair: task_priority(*pair))

    assigned: list[Planned] = []
    unassigned: list[Task] = []
    for task, candidates in pending:
        if not candidates:
            unassigned.append(task)
            continue
        options = [(w, schedule(task.effort, w.availability, start, last.get(w.id))) for w in candidates]
        worker, planned = min(options, key=lambda option: worker_priority(*option))
        last[worker.id] = planned
        assigned.append(Planned(task=task, worker=worker, schedule=planned))
    return AutoAssignResult(assigned=assigned, unassigned=unassigned)
