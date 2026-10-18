"""Reglas de negocio puras: sin HTTP, base de datos ni repositorios (ver README_NEGOCIO.md).

Todo lo que define el resultado de una asignación vive aquí, para probarlo con tests unitarios
rápidos y con muchos casos borde.
"""

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date, timedelta

from app.domain.models import Task, Worker


# ---------------------------------------------------------------------------
# Compatibilidad de skills (RN6, RN7)
# ---------------------------------------------------------------------------


def can_take(task_skills: Iterable[str], worker_skills: Iterable[str]) -> bool:
    """True si las skills de la tarea son un subconjunto de las del trabajador."""
    # RN7: el conjunto vacío es subconjunto de todos, así que una tarea sin skills la toma cualquiera
    return set(task_skills) <= set(worker_skills)


# ---------------------------------------------------------------------------
# Cálculo de fechas (RN12 a RN16)
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Schedule:
    """Fechas calculadas de una tarea en la agenda de su trabajador; no se guardan (RN26)."""

    start: date
    end: date
    last_day_hours: int  # horas ya ocupadas del trabajador el día `end` (esta tarea y las anteriores): la siguiente usa lo que sobra (RN15)


def business_day(day: date) -> date:
    """El mismo día si es hábil; si cae en fin de semana, el lunes siguiente (RN12, RN13)."""
    while day.weekday() >= 5:
        day += timedelta(days=1)
    return day


def schedule(effort: int, availability: int, start: date, after: Schedule | None = None) -> Schedule:
    """Calcula en qué días hábiles se trabaja una tarea.

    - `start`: fecha de inicio pedida; si cae en fin de semana se mueve al lunes (RN13).
    - `after`: última tarea ya programada del trabajador; la nueva arranca cuando esa termina,
      usando las horas que sobran de ese día (RN15). Si `after` termina antes de `start`, no
      le quita horas (RN20).
    - `last_day_hours` son las horas ocupadas del trabajador el día `end`, contando las de `after`
      si la tarea termina ese mismo día: así la siguiente usa exactamente lo que sobra (RN15).
    """
    day = business_day(start)  # RN13
    used = 0  # horas ya ocupadas en `day`
    if after is not None and after.end >= day:
        # RN15: arranca cuando termina la anterior, con las horas que sobran de ese día
        day, used = after.end, after.last_day_hours
    if used >= availability:
        # el día quedó lleno: empieza al siguiente día hábil (RN14)
        day, used = business_day(day + timedelta(days=1)), 0

    first_day = day
    remaining = effort
    while True:
        hours = min(remaining, availability - used)  # RN14: hasta la disponibilidad del día
        remaining -= hours
        used += hours
        if remaining <= 0:
            # RN16: el fin es el último día hábil con horas de la tarea
            return Schedule(start=first_day, end=day, last_day_hours=used)
        day, used = business_day(day + timedelta(days=1)), 0


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
    # sorted es estable: a igual `start` conserva el orden de asignación (RN15)
    result: dict[int, Schedule] = {}
    previous: Schedule | None = None
    for slot in sorted(slots, key=lambda s: s.start):
        previous = schedule(slot.effort, availability, slot.start, after=previous)
        result[slot.task_id] = previous
    return result


def late_starts(slots: list[Slot], availability: int) -> list[int]:
    """task_id de las tareas que no trabajan ninguna hora en su día de inicio (RN25)."""
    # Se recorre toda la agenda: el corrimiento se propaga en cascada (RN25, RN26)
    dates = agenda(slots, availability)
    return [slot.task_id for slot in slots if dates[slot.task_id].start != business_day(slot.start)]


def earliest_slot(task_id: int, effort: int, availability: int, start: date, slots: list[Slot]) -> tuple[Slot, Schedule]:
    """Primer día hábil desde `start` en que la tarea cabe en la agenda (RN19, RN29): trabaja al menos
    1 h ese día y ninguna otra tarea pierde su día de inicio (RN25). Devuelve el slot y sus fechas.

    - Usa los huecos libres antes de tareas futuras; la nueva va después de las que inician el mismo día (RN15).
    - Un inicio más temprano nunca termina más tarde, así que el primer día válido es el que termina más pronto.
    - Después de la última tarea de la agenda siempre cabe, así que el recorrido termina.
    - Las tareas que ya perdían su día de inicio antes de insertar no bloquean.
    """
    before = set(late_starts(slots, availability))
    day = start
    while True:
        if day.weekday() < 5:  # RN12, RN13
            slot = Slot(task_id=task_id, effort=effort, start=day)
            trial = [*slots, slot]
            if not set(late_starts(trial, availability)) - before:
                return slot, agenda(trial, availability)[task_id]
        day += timedelta(days=1)


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
    agendas: dict[int, list[Slot]] | None = None,
) -> AutoAssignResult:
    """Reparte `tasks` (ya filtradas: not-done, sin asignar y guardadas) entre `workers`.

    - Candidatos: trabajadores que cumplen las skills (RN18).
    - Recorre las tareas según `task_priority` (RN27).
    - En cada candidato la tarea entra en el primer hueco donde cabe, o al final (`earliest_slot`, RN29).
    - Elige al candidato según `worker_priority`: el que termina más pronto según su agenda (RN19)
      y, si empatan, el desempate de RN28. La agenda se actualiza en la misma corrida.
    - `agendas`: worker_id -> slots de su agenda actual, en orden de asignación.
    - Si nadie cumple las skills, la tarea va a `unassigned` (RN21).
    """
    # copia: la corrida no modifica la agenda recibida
    slots: dict[int | None, list[Slot]] = {worker_id: list(s) for worker_id, s in (agendas or {}).items()}
    pending = [(task, [w for w in workers if can_take(task.skills, w.skills)]) for task in tasks]
    pending.sort(key=lambda pair: task_priority(*pair))

    assigned: list[Planned] = []
    unassigned: list[Task] = []
    for task, candidates in pending:
        if not candidates:
            unassigned.append(task)
            continue
        assert task.id is not None
        options = [
            (w, *earliest_slot(task.id, task.effort, w.availability, start, slots.get(w.id, []))) for w in candidates
        ]
        worker, slot, planned = min(options, key=lambda option: worker_priority(option[0], option[2]))
        slots.setdefault(worker.id, []).append(slot)
        assigned.append(Planned(task=task, worker=worker, schedule=planned))
    return AutoAssignResult(assigned=assigned, unassigned=unassigned)
