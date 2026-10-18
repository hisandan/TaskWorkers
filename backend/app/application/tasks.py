"""Req1: casos de uso de tareas."""

from app.application.assignments import check_start_days, worker_slots
from app.application.ports import AssignmentRepository, TaskRepository, WorkerRepository
from app.domain import rules
from app.domain.errors import HasAssignments, MissingSkills, TaskNotFound
from app.domain.models import Task


class TaskService:
    def __init__(self, tasks: TaskRepository, workers: WorkerRepository, assignments: AssignmentRepository) -> None:
        self.tasks = tasks
        self.workers = workers
        self.assignments = assignments

    def all(self) -> list[Task]:
        return self.tasks.all()

    def get(self, task_id: int) -> Task:
        task = self.tasks.get(task_id)
        if task is None:
            raise TaskNotFound(f"Tarea {task_id} no existe")
        return task

    def create(self, task: Task) -> Task:
        # RN2: toda tarea nueva nace not-done, sin importar el estado recibido
        return self.tasks.save(Task(name=task.name, effort=task.effort, skills=list(task.skills), status="not-done"))

    def update(self, task_id: int, changes: Task) -> Task:
        self.get(task_id)
        # Objeto nuevo: la tarea guardada no cambia hasta pasar la validación (RN22)
        updated = Task(id=task_id, name=changes.name, effort=changes.effort, skills=list(changes.skills), status=changes.status)

        assignment = self.assignments.get_by_task(task_id)
        if assignment is not None:
            worker = self.workers.get(assignment.worker_id)
            assert worker is not None
            if not rules.can_take(updated.skills, worker.skills):  # RN6
                raise MissingSkills(f"Al trabajador {worker.id} le faltan skills de la tarea {task_id}")
            # RN25: done conserva sus horas en la agenda (RN23), así que solo cuenta el esfuerzo
            before = worker_slots(worker.pk, self.tasks, self.assignments)
            after = worker_slots(worker.pk, self.tasks, self.assignments, edited=updated)
            check_start_days(before, after, worker.availability, worker.availability)

        return self.tasks.save(updated)

    def delete(self, task_id: int) -> None:
        self.get(task_id)
        if self.assignments.get_by_task(task_id) is not None:  # RN24
            raise HasAssignments(f"La tarea {task_id} tiene una asignación")
        self.tasks.delete(task_id)
