"""Punto de composición: arma cada caso de uso con sus adaptadores.

Los tests de integración sobreescriben get_session (transacción con rollback) y get_clock (hoy fijo).
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.adapters.clock import SystemClock
from app.adapters.sql.db import get_session
from app.adapters.sql.repositories import SqlAssignmentRepository, SqlTaskRepository, SqlWorkerRepository
from app.application.assignments import AssignmentService
from app.application.ports import Clock
from app.application.tasks import TaskService
from app.application.workers import WorkerService

SessionDep = Annotated[Session, Depends(get_session)]


def get_clock() -> Clock:
    # "Hoy" se inyecta para que los tests fijen la fecha (RN11, RN20)
    return SystemClock()


ClockDep = Annotated[Clock, Depends(get_clock)]


def get_task_service(session: SessionDep) -> TaskService:
    return TaskService(SqlTaskRepository(session), SqlAssignmentRepository(session))


def get_worker_service(session: SessionDep) -> WorkerService:
    return WorkerService(SqlWorkerRepository(session), SqlAssignmentRepository(session))


def get_assignment_service(session: SessionDep, clock: ClockDep) -> AssignmentService:
    return AssignmentService(
        SqlTaskRepository(session),
        SqlWorkerRepository(session),
        SqlAssignmentRepository(session),
        clock,
    )


TaskServiceDep = Annotated[TaskService, Depends(get_task_service)]
WorkerServiceDep = Annotated[WorkerService, Depends(get_worker_service)]
AssignmentServiceDep = Annotated[AssignmentService, Depends(get_assignment_service)]
