"""Implementan los puertos de app.application.ports sobre Postgres.

Mapean TaskRow <-> Task (y así con cada entidad): el dominio nunca recibe un objeto de SQLAlchemy.
Las skills llegan al dominio como nombres; al guardar, db.skill_rows las busca o las crea.
Solo hacen flush; el commit es por request (ver db.get_session).
"""

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.adapters.sql.db import AssignmentRow, TaskRow, WorkerRow, skill_rows
from app.domain.models import Assignment, Task, Worker


# Clave del advisory lock de las agendas: cualquier entero fijo que no use otro lock de la app
SCHEDULES_LOCK = 1


def to_task(row: TaskRow) -> Task:
    return Task(id=row.id, name=row.name, effort=row.effort, skills=[s.name for s in row.skills], status=row.status)


def to_worker(row: WorkerRow) -> Worker:
    return Worker(id=row.id, name=row.name, availability=row.availability, skills=[s.name for s in row.skills])


def to_assignment(row: AssignmentRow) -> Assignment:
    return Assignment(id=row.id, task_id=row.task_id, worker_id=row.worker_id, start_date=row.start_date)


class SqlTaskRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def all(self) -> list[Task]:
        return [to_task(row) for row in self.session.scalars(select(TaskRow).order_by(TaskRow.id))]

    def get(self, task_id: int) -> Task | None:
        row = self.session.get(TaskRow, task_id)
        return to_task(row) if row else None

    def save(self, task: Task) -> Task:
        # Sin id se crea; con id se actualiza la fila existente
        row = TaskRow() if task.id is None else self.session.get_one(TaskRow, task.id)
        row.name = task.name
        row.effort = task.effort
        row.skills = skill_rows(self.session, task.skills)
        row.status = task.status
        self.session.add(row)
        self.session.flush()
        task.id = row.id
        return to_task(row)

    def delete(self, task_id: int) -> None:
        row = self.session.get(TaskRow, task_id)
        if row:
            self.session.delete(row)
            self.session.flush()


class SqlWorkerRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def all(self) -> list[Worker]:
        return [to_worker(row) for row in self.session.scalars(select(WorkerRow).order_by(WorkerRow.id))]

    def get(self, worker_id: int) -> Worker | None:
        row = self.session.get(WorkerRow, worker_id)
        return to_worker(row) if row else None

    def save(self, worker: Worker) -> Worker:
        row = WorkerRow() if worker.id is None else self.session.get_one(WorkerRow, worker.id)
        row.name = worker.name
        row.availability = worker.availability
        row.skills = skill_rows(self.session, worker.skills)
        self.session.add(row)
        self.session.flush()
        worker.id = row.id
        return to_worker(row)

    def delete(self, worker_id: int) -> None:
        row = self.session.get(WorkerRow, worker_id)
        if row:
            self.session.delete(row)
            self.session.flush()


class SqlAssignmentRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def all(self) -> list[Assignment]:
        rows = self.session.scalars(select(AssignmentRow).order_by(AssignmentRow.id))
        return [to_assignment(row) for row in rows]

    def get(self, assignment_id: int) -> Assignment | None:
        row = self.session.get(AssignmentRow, assignment_id)
        return to_assignment(row) if row else None

    def get_by_task(self, task_id: int) -> Assignment | None:
        row = self.session.scalar(select(AssignmentRow).where(AssignmentRow.task_id == task_id))
        return to_assignment(row) if row else None

    def list_by_worker(self, worker_id: int) -> list[Assignment]:
        # Ordenadas por id: el orden de asignación desempata las que inician el mismo día (RN15)
        query = select(AssignmentRow).where(AssignmentRow.worker_id == worker_id).order_by(AssignmentRow.id)
        return [to_assignment(row) for row in self.session.scalars(query)]

    def save(self, assignment: Assignment) -> Assignment:
        row = AssignmentRow() if assignment.id is None else self.session.get_one(AssignmentRow, assignment.id)
        row.task_id = assignment.task_id
        row.worker_id = assignment.worker_id
        row.start_date = assignment.start_date
        self.session.add(row)
        self.session.flush()
        assignment.id = row.id
        return to_assignment(row)

    def delete(self, assignment_id: int) -> None:
        row = self.session.get(AssignmentRow, assignment_id)
        if row:
            self.session.delete(row)
            self.session.flush()

    def lock_schedules(self) -> None:
        # Advisory lock de Postgres: otra transacción que lo pida espera hasta el commit o rollback de esta
        self.session.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": SCHEDULES_LOCK})
