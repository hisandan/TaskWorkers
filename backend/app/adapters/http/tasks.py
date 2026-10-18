"""Req1: CRUD de tareas. Sin lógica: traduce HTTP <-> TaskService."""

from fastapi import APIRouter, status
from pydantic import BaseModel, ConfigDict

from app.adapters.http.dependencies import TaskServiceDep
from app.domain.models import Task

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskIn(BaseModel):
    name: str
    effort: int  # TODO RN1: entero > 0
    skills: list[str] = []
    status: str = "not-done"  # TODO RN2: solo done | not-done

    def to_domain(self) -> Task:
        return Task(name=self.name, effort=self.effort, skills=self.skills, status=self.status)


class TaskOut(TaskIn):
    model_config = ConfigDict(from_attributes=True)

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
def update_task(task_id: int, body: TaskIn, service: TaskServiceDep):
    return service.update(task_id, body.to_domain())


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, service: TaskServiceDep):
    service.delete(task_id)
