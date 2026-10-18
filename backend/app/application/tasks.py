"""Req1: casos de uso de tareas."""

from app.application.ports import AssignmentRepository, TaskRepository, WorkerRepository
from app.domain.models import Task


class TaskService:
    def __init__(self, tasks: TaskRepository, workers: WorkerRepository, assignments: AssignmentRepository) -> None:
        self.tasks = tasks
        self.workers = workers
        self.assignments = assignments

    def all(self) -> list[Task]:
        raise NotImplementedError("Req1")

    def get(self, task_id: int) -> Task:
        # TaskNotFound si no existe
        raise NotImplementedError("Req1")

    def create(self, task: Task) -> Task:
        raise NotImplementedError("Req1, RN2")

    def update(self, task_id: int, changes: Task) -> Task:
        # Si está asignada, revalida contra la agenda de su trabajador antes de guardar (RN22):
        # MissingSkills si el trabajador no tiene las skills nuevas (RN6),
        # WorkerBusy si el esfuerzo nuevo deja alguna tarea sin su día de inicio (RN25)
        raise NotImplementedError("Req1, RN22, RN23")

    def delete(self, task_id: int) -> None:
        # HasAssignments si la tarea tiene asignación (RN24)
        raise NotImplementedError("Req1, RN24")
