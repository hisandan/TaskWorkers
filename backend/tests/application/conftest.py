from collections.abc import Callable
from datetime import date

import pytest

from app.application.assignments import AssignmentService
from app.application.tasks import TaskService
from app.application.workers import WorkerService
from app.domain.models import Assignment, Task, Worker
from tests.dates import MON_19
from tests.fakes import FixedClock, InMemoryAssignmentRepository, InMemoryTaskRepository, InMemoryWorkerRepository

# Los casos de uso se prueban contra los puertos con dobles en memoria: sin Postgres ni HTTP


@pytest.fixture
def tasks() -> InMemoryTaskRepository:
    return InMemoryTaskRepository()


@pytest.fixture
def workers() -> InMemoryWorkerRepository:
    return InMemoryWorkerRepository()


@pytest.fixture
def assignments() -> InMemoryAssignmentRepository:
    return InMemoryAssignmentRepository()


@pytest.fixture
def clock() -> FixedClock:
    """Hoy = lun 19; un escenario puntual lo cambia con `clock.day = ...` (ej. ESC-28: hoy = sáb 24)."""
    return FixedClock(MON_19)


@pytest.fixture
def task_service(tasks, workers, assignments) -> TaskService:
    return TaskService(tasks, workers, assignments)


@pytest.fixture
def worker_service(workers, tasks, assignments) -> WorkerService:
    return WorkerService(workers, tasks, assignments)


@pytest.fixture
def assignment_service(tasks, workers, assignments, clock) -> AssignmentService:
    return AssignmentService(tasks, workers, assignments, clock)


# Fábricas: preparan el "Dado" directo en los repositorios, sin pasar por el caso de uso que se está probando.
# Misma firma que las de tests/integration/conftest.py


@pytest.fixture
def make_task(tasks: InMemoryTaskRepository) -> Callable[..., Task]:
    def _make(name: str = "API", effort: int = 10, skills: list[str] | None = None, status: str = "not-done") -> Task:
        return tasks.save(Task(name=name, effort=effort, skills=skills or [], status=status))

    return _make


@pytest.fixture
def make_worker(workers: InMemoryWorkerRepository) -> Callable[..., Worker]:
    def _make(name: str = "Ana", availability: int = 6, skills: list[str] | None = None) -> Worker:
        return workers.save(Worker(name=name, availability=availability, skills=skills or []))

    return _make


@pytest.fixture
def make_assignment(assignments: InMemoryAssignmentRepository) -> Callable[..., Assignment]:
    def _make(task: Task, worker: Worker, start: date = MON_19) -> Assignment:
        return assignments.save(Assignment(task_id=task.pk, worker_id=worker.pk, start_date=start))

    return _make
