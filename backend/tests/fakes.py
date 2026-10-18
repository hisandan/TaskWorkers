"""Dobles de los puertos (app.application.ports): repositorios en memoria y un reloj fijo."""

from datetime import date
from itertools import count

from app.domain.models import Assignment, Task, Worker


class InMemoryRepository[T: Task | Worker | Assignment]:
    def __init__(self) -> None:
        self.rows: dict[int, T] = {}
        self.ids = count(1)

    def all(self) -> list[T]:
        return list(self.rows.values())

    def get(self, entity_id: int) -> T | None:
        return self.rows.get(entity_id)

    def save(self, entity: T) -> T:
        if entity.id is None:
            entity.id = next(self.ids)
        self.rows[entity.id] = entity
        return entity

    def delete(self, entity_id: int) -> None:
        del self.rows[entity_id]


class InMemoryTaskRepository(InMemoryRepository[Task]):
    pass


class InMemoryWorkerRepository(InMemoryRepository[Worker]):
    pass


class InMemoryAssignmentRepository(InMemoryRepository[Assignment]):
    def get_by_task(self, task_id: int) -> Assignment | None:
        return next((a for a in self.rows.values() if a.task_id == task_id), None)

    def list_by_worker(self, worker_id: int) -> list[Assignment]:
        return [a for a in self.rows.values() if a.worker_id == worker_id]


class FixedClock:
    def __init__(self, day: date) -> None:
        self.day = day

    def today(self) -> date:
        return self.day
