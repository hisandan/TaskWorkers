"""Req1: CRUD de tareas. Sin lógica: traduce HTTP <-> TaskService."""

from typing import Literal

from fastapi import APIRouter, status
from pydantic import BaseModel, ConfigDict, Field

from app.adapters.http.dependencies import TaskServiceDep
from app.domain.models import Task

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskIn(BaseModel):
    # Al crear no se recibe el estado: la tarea nace not-done (RN2); si lo envían, 422
    model_config = ConfigDict(extra="forbid")

    name: str
    effort: int = Field(gt=0)  # RN1: horas enteras > 0
    skills: list[str] = []

    def to_domain(self) -> Task:
        return Task(name=self.name, effort=self.effort, skills=self.skills)


class TaskUpdate(TaskIn):
    status: Literal["done", "not-done"] = "not-done"  # RN2

    def to_domain(self) -> Task:
        return Task(name=self.name, effort=self.effort, skills=self.skills, status=self.status)


class TaskOut(TaskUpdate):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: int


@router.get("", response_model=list[TaskOut])
def list_tasks(service: TaskServiceDep):
    return service.all()


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(body: TaskIn, service: TaskServiceDep):
    return service.create(body.to_domain())


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, service: TaskServiceDep):
    return service.get(task_id)


@router.put("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, body: TaskUpdate, service: TaskServiceDep):
    return service.update(task_id, body.to_domain())


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, service: TaskServiceDep):
    service.delete(task_id)
