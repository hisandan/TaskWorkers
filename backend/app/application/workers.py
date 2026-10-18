"""Req2: casos de uso de trabajadores."""

from app.application.ports import AssignmentRepository, TaskRepository, WorkerRepository
from app.domain.models import Worker


class WorkerService:
    def __init__(self, workers: WorkerRepository, tasks: TaskRepository, assignments: AssignmentRepository) -> None:
        self.workers = workers
        self.tasks = tasks
        self.assignments = assignments

    def all(self) -> list[Worker]:
        raise NotImplementedError("Req2")

    def get(self, worker_id: int) -> Worker:
        # WorkerNotFound si no existe
        raise NotImplementedError("Req2")

    def create(self, worker: Worker) -> Worker:
        raise NotImplementedError("Req2")

    def update(self, worker_id: int, changes: Worker) -> Worker:
        # Revalida su agenda antes de guardar (RN22):
        # MissingSkills si le quitan una skill que pide alguna de sus tareas (RN6),
        # WorkerBusy si la disponibilidad nueva deja alguna tarea sin su día de inicio (RN25)
        raise NotImplementedError("Req2, RN22")

    def delete(self, worker_id: int) -> None:
        # HasAssignments si el trabajador tiene asignaciones (RN24)
        raise NotImplementedError("Req2, RN24")
