"""Req3, Req3a: asignación manual. Req4: auto-asignación.

Los casos de uso leen por los puertos, validan contra el estado actual, delegan el cálculo
a app.domain.rules y guardan el resultado.
"""

from dataclasses import dataclass
from datetime import date

from app.application.ports import AssignmentRepository, Clock, TaskRepository, WorkerRepository
from app.domain.models import Task


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
        raise NotImplementedError("Req3, RN26")

    def assign(self, task_id: int, worker_id: int, start: date) -> ScheduledAssignment:
        # TaskNotFound / WorkerNotFound si no existen
        # StartInPast si start < hoy (RN11)
        # TaskDone (RN8), TaskAlreadyAssigned (RN9) o MissingSkills (RN6)
        # Se guarda el inicio ya movido al lunes si cae en fin de semana (RN13)
        # Se inserta en la agenda del trabajador; WorkerBusy si alguna tarea pierde su día de inicio (RN25)
        raise NotImplementedError("Req3, Req3a, RN6 a RN13, RN25")

    def auto_assign(self) -> AutoAssignReport:
        # Toma solo tareas not-done sin asignar (RN17) e inicia el siguiente día hábil después de hoy (RN20)
        # El reparto lo decide rules.auto_assign (RN18, RN19, RN21); cada tarea va al final de la agenda
        raise NotImplementedError("Req4, RN17 a RN21")
