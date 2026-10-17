"""Req1: CRUD de tareas."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.db import get_session

router = APIRouter(prefix="/tasks", tags=["tasks"])

SessionDep = Annotated[Session, Depends(get_session)]


class TaskIn(BaseModel):
    name: str
    effort: int  # TODO RN1: entero > 0
    skills: list[str] = []
    status: str = "not-done"  # TODO RN2: solo done | not-done


class TaskOut(TaskIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


@router.get("", response_model=list[TaskOut])
def list_tasks(session: SessionDep):
    raise NotImplementedError("Req1")


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(body: TaskIn, session: SessionDep):
    raise NotImplementedError("Req1, RN2")


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, session: SessionDep):
    raise NotImplementedError("Req1")


@router.put("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, body: TaskIn, session: SessionDep):
    raise NotImplementedError("Req1, RN22, RN23")


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, session: SessionDep):
    raise NotImplementedError("Req1, RN24")
