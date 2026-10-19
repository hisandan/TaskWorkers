"""Req2: casos de uso de trabajadores."""

from app.application.assignments import check_start_days, worker_slots
from app.application.ports import AssignmentRepository, TaskRepository, WorkerRepository
from app.domain import rules
from app.domain.errors import HasAssignments, MissingSkills, WorkerNotFound
from app.domain.models import Worker


class WorkerService:
    def __init__(self, workers: WorkerRepository, tasks: TaskRepository, assignments: AssignmentRepository) -> None:
        self.workers = workers
        self.tasks = tasks
        self.assignments = assignments

    def all(self) -> list[Worker]:
        return self.workers.all()

    def get(self, worker_id: int) -> Worker:
        worker = self.workers.get(worker_id)
        if worker is None:
            raise WorkerNotFound(f"Trabajador {worker_id} no existe")
        return worker

    def create(self, worker: Worker) -> Worker:
        return self.workers.save(Worker(name=worker.name, availability=worker.availability, skills=list(worker.skills)))

    def update(self, worker_id: int, changes: Worker) -> Worker:
        self.assignments.lock_schedules()
        current = self.get(worker_id)
        # Objeto nuevo: el trabajador guardado no cambia hasta pasar la validación (RN22)
        updated = Worker(id=worker_id, name=changes.name, availability=changes.availability, skills=list(changes.skills))

        # RN6: cada tarea asignada (incluidas las done, RN23) debe seguir cumpliendo las skills
        for assignment in self.assignments.list_by_worker(worker_id):
            task = self.tasks.get(assignment.task_id)
            assert task is not None
            if not rules.can_take(task.skills, updated.skills):
                raise MissingSkills(f"Al trabajador {worker_id} le faltarían skills de la tarea {task.id}")

        # RN25: la misma agenda con la disponibilidad nueva
        slots = worker_slots(worker_id, self.tasks, self.assignments)
        check_start_days(slots, slots, current.availability, updated.availability)

        return self.workers.save(updated)

    def delete(self, worker_id: int) -> None:
        self.assignments.lock_schedules()
        self.get(worker_id)
        if self.assignments.list_by_worker(worker_id):  # RN24
            raise HasAssignments(f"El trabajador {worker_id} tiene asignaciones")
        self.workers.delete(worker_id)
