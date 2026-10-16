from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import Task, get_session

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class TaskPage(BaseModel):
    items: list[TaskOut]
    total: int
    page: int
    size: int


@router.get("", response_model=TaskPage)
def list_tasks(
    session: Annotated[Session, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 10,
) -> TaskPage:
    total = session.scalar(select(func.count()).select_from(Task)) or 0
    tasks = session.scalars(
        select(Task).order_by(Task.id).offset((page - 1) * size).limit(size)
    ).all()
    return TaskPage(
        items=[TaskOut.model_validate(t) for t in tasks],
        total=total,
        page=page,
        size=size,
    )
