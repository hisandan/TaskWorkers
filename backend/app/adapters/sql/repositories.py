"""Implementan los puertos de app.application.ports sobre Postgres.

Mapean TaskRow <-> Task (y así con cada entidad): el dominio nunca recibe un objeto de SQLAlchemy.
Las skills llegan al dominio como nombres; al guardar, db.skill_rows las busca o las crea.
Solo hacen flush; el commit es por request (ver db.get_session).
"""

from sqlalchemy.orm import Session

from app.domain.models import Assignment, Task, Worker


class SqlTaskRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def all(self) -> list[Task]:
        raise NotImplementedError("TaskRepository.all")

    def get(self, task_id: int) -> Task | None:
        raise NotImplementedError("TaskRepository.get")

    def save(self, task: Task) -> Task:
        raise NotImplementedError("TaskRepository.save")

    def delete(self, task_id: int) -> None:
        raise NotImplementedError("TaskRepository.delete")


class SqlWorkerRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def all(self) -> list[Worker]:
        raise NotImplementedError("WorkerRepository.all")

    def get(self, worker_id: int) -> Worker | None:
        raise NotImplementedError("WorkerRepository.get")

    def save(self, worker: Worker) -> Worker:
        raise NotImplementedError("WorkerRepository.save")

    def delete(self, worker_id: int) -> None:
        raise NotImplementedError("WorkerRepository.delete")


class SqlAssignmentRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def all(self) -> list[Assignment]:
        raise NotImplementedError("AssignmentRepository.all")

    def get_by_task(self, task_id: int) -> Assignment | None:
        raise NotImplementedError("AssignmentRepository.get_by_task")

    def list_by_worker(self, worker_id: int) -> list[Assignment]:
        # Ordenadas por id: el orden de asignación desempata las que inician el mismo día (RN15)
        raise NotImplementedError("AssignmentRepository.list_by_worker")

    def save(self, assignment: Assignment) -> Assignment:
        raise NotImplementedError("AssignmentRepository.save")
