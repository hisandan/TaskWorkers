"""Req2: casos de uso de trabajadores."""

from app.application.ports import AssignmentRepository, WorkerRepository
from app.domain.models import Worker


class WorkerService:
    def __init__(self, workers: WorkerRepository, assignments: AssignmentRepository) -> None:
        self.workers = workers
        self.assignments = assignments

    def all(self) -> list[Worker]:
        raise NotImplementedError("Req2")

    def get(self, worker_id: int) -> Worker:
        # WorkerNotFound si no existe
        raise NotImplementedError("Req2")

    def create(self, worker: Worker) -> Worker:
        raise NotImplementedError("Req2")

    def update(self, worker_id: int, changes: Worker) -> Worker:
        # No revalida ni recalcula sus asignaciones (RN22)
        raise NotImplementedError("Req2, RN22")

    def delete(self, worker_id: int) -> None:
        # HasAssignments si el trabajador tiene asignaciones (RN24)
        raise NotImplementedError("Req2, RN24")
