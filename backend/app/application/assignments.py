"""Req3, Req3a: asignación manual. Req4: auto-asignación.

Los casos de uso leen por los puertos, validan contra el estado actual, delegan el cálculo
a app.domain.rules y guardan el resultado.
"""

from dataclasses import dataclass
from datetime import date, timedelta

from app.application.ports import AssignmentRepository, Clock, TaskRepository, WorkerRepository
from app.domain import rules
from app.domain.errors import (
    MissingSkills,
    StartInPast,
    StartNotBusinessDay,
    TaskAlreadyAssigned,
    TaskDone,
    TaskNotFound,
    WorkerBusy,
    WorkerNotFound,
)
from app.domain.models import Assignment, Task
from app.domain.rules import Slot


@dataclass(frozen=True)
class ScheduledAssignment:
    """Read model: la asignación con sus fechas calculadas desde la agenda del trabajador (RN26)."""

    id: int
    task_id: int
    worker_id: int
    start_date: date
    end_date: date


@dataclass(frozen=True)
class AutoAssignReport:
    assigned: list[ScheduledAssignment]
    unassigned: list[Task]


def worker_slots(
    worker_id: int, tasks: TaskRepository, assignments: AssignmentRepository, edited: Task | None = None
) -> list[Slot]:
    """Agenda guardada del trabajador como Slots, en orden de asignación. Incluye las tareas done (RN23).

    `edited` reemplaza a la tarea guardada con el mismo id, para validar una edición antes de guardarla (RN22).
    """
    slots = []
    for assignment in assignments.list_by_worker(worker_id):
        task = edited if edited is not None and edited.id == assignment.task_id else tasks.get(assignment.task_id)
        assert task is not None
        slots.append(Slot(task_id=assignment.task_id, effort=task.effort, start=assignment.start_date))
    return slots


def check_start_days(before: list[Slot], after: list[Slot], availability_before: int, availability_after: int) -> None:
    """WorkerBusy si algún cambio deja una tarea sin horas en su día de inicio (RN25).

    Las que ya lo perdían antes del cambio no bloquean, igual que en rules.earliest_slot.
    """
    late = set(rules.late_starts(after, availability_after)) - set(rules.late_starts(before, availability_before))
    if late:
        raise WorkerBusy(f"Tareas que perderían su día de inicio: {sorted(late)}")


class AssignmentService:
    def __init__(
        self,
        tasks: TaskRepository,
        workers: WorkerRepository,
        assignments: AssignmentRepository,
        clock: Clock,
    ) -> None:
        self.tasks = tasks
        self.workers = workers
        self.assignments = assignments
        self.clock = clock

    def all(self) -> list[ScheduledAssignment]:
        # Las fechas de fin se calculan con rules.agenda, trabajador por trabajador (RN26)
        stored = self.assignments.all()
        schedules = {}
        for worker_id in {a.worker_id for a in stored}:
            worker = self.workers.get(worker_id)
            assert worker is not None
            schedules.update(rules.agenda(worker_slots(worker_id, self.tasks, self.assignments), worker.availability))
        return [self._scheduled(a, schedules[a.task_id].end) for a in stored]

    def assign(self, task_id: int, worker_id: int, start: date) -> ScheduledAssignment:
        task = self.tasks.get(task_id)
        if task is None:
            raise TaskNotFound(f"Tarea {task_id} no existe")
        worker = self.workers.get(worker_id)
        if worker is None:
            raise WorkerNotFound(f"Trabajador {worker_id} no existe")
        if start < self.clock.today():  # RN11
            raise StartInPast(f"La fecha de inicio {start} está en el pasado")
        if rules.business_day(start) != start:  # RN13
            raise StartNotBusinessDay(f"La fecha de inicio {start} cae en fin de semana")
        if task.status == "done":  # RN8
            raise TaskDone(f"La tarea {task_id} ya está done")
        if self.assignments.get_by_task(task_id) is not None:  # RN9
            raise TaskAlreadyAssigned(f"La tarea {task_id} ya está asignada")
        if not rules.can_take(task.skills, worker.skills):  # RN6, RN7
            raise MissingSkills(f"Al trabajador {worker_id} le faltan skills de la tarea {task_id}")

        slots = worker_slots(worker_id, self.tasks, self.assignments)
        trial = [*slots, Slot(task_id=task_id, effort=task.effort, start=start)]
        check_start_days(slots, trial, worker.availability, worker.availability)  # RN25

        saved = self.assignments.save(Assignment(task_id=task_id, worker_id=worker_id, start_date=start))
        return self._scheduled(saved, rules.agenda(trial, worker.availability)[task_id].end)

    def auto_assign(self) -> AutoAssignReport:
        # RN17: solo tareas not-done sin asignar
        pending = [t for t in self.tasks.all() if t.status == "not-done" and self.assignments.get_by_task(t.id) is None]
        start = rules.business_day(self.clock.today() + timedelta(days=1))  # RN20: siguiente día hábil después de hoy
        workers = self.workers.all()
        agendas = {w.id: worker_slots(w.id, self.tasks, self.assignments) for w in workers}

        # RN18, RN19, RN21, RN27 a RN29: el reparto lo decide el dominio
        result = rules.auto_assign(pending, workers, start, agendas)
        for planned in result.assigned:
            self.assignments.save(
                Assignment(task_id=planned.task.id, worker_id=planned.worker.id, start_date=planned.schedule.start)
            )

        # Fechas finales: una tarea insertada después en un hueco puede correr el fin de otra de la misma corrida
        by_task = {a.task_id: a for a in self.all()}
        return AutoAssignReport(
            assigned=[by_task[planned.task.id] for planned in result.assigned],
            unassigned=result.unassigned,
        )

    @staticmethod
    def _scheduled(assignment: Assignment, end: date) -> ScheduledAssignment:
        assert assignment.id is not None
        return ScheduledAssignment(
            id=assignment.id,
            task_id=assignment.task_id,
            worker_id=assignment.worker_id,
            start_date=assignment.start_date,
            end_date=end,
        )
