"""Req1: casos de uso de tareas."""

from app.application.ports import AssignmentRepository, TaskRepository
from app.domain.models import Task


class TaskService:
    def __init__(self, tasks: TaskRepository, assignments: AssignmentRepository) -> None:
        self.tasks = tasks
        self.assignments = assignments

    def all(self) -> list[Task]:
        raise NotImplementedError("Req1")

    def get(self, task_id: int) -> Task:
        # TaskNotFound si no existe
        raise NotImplementedError("Req1")

    def create(self, task: Task) -> Task:
        raise NotImplementedError("Req1, RN2")

    def update(self, task_id: int, changes: Task) -> Task:
        # No revalida ni recalcula la asignación existente (RN22, RN23)
        raise NotImplementedError("Req1, RN22, RN23")

    def delete(self, task_id: int) -> None:
        # HasAssignments si la tarea tiene asignación (RN24)
        raise NotImplementedError("Req1, RN24")
