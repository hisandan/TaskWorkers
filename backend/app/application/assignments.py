"""Req3, Req3a: asignación manual. Req4: auto-asignación.

Los casos de uso leen por los puertos, validan contra el estado actual, delegan el cálculo
a app.domain.rules y guardan el resultado.
"""

from dataclasses import dataclass
from datetime import date

from app.application.ports import AssignmentRepository, Clock, TaskRepository, WorkerRepository
from app.domain.models import Assignment, Task


@dataclass(frozen=True)
class AutoAssignReport:
    assigned: list[Assignment]
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

    def all(self) -> list[Assignment]:
        raise NotImplementedError("Req3")

    def assign(self, task_id: int, worker_id: int, start: date) -> Assignment:
        # TaskNotFound / WorkerNotFound si no existen
        # StartInPast si start < hoy (RN11)
        # MissingSkills (RN6), TaskDone (RN8) o TaskAlreadyAssigned (RN9)
        # Las fechas salen de rules.schedule, después de la agenda del trabajador (RN13, RN15)
        raise NotImplementedError("Req3, Req3a, RN6 a RN11")

    def auto_assign(self) -> AutoAssignReport:
        # Toma solo tareas not-done sin asignar (RN17) e inicia el siguiente día hábil (RN20)
        # El reparto lo decide rules.auto_assign (RN18, RN19, RN21)
        raise NotImplementedError("Req4, RN17 a RN21")
