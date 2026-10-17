"""Req3, Req3a: asignación manual. Req4: auto-asignación.

Los endpoints validan contra la base y delegan el cálculo a app.domain.
"""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.api.tasks import TaskOut
from app.db import get_session

router = APIRouter(prefix="/assignments", tags=["assignments"])

SessionDep = Annotated[Session, Depends(get_session)]


def get_today() -> date:
    # "Hoy" se inyecta para que los tests fijen la fecha (RN11, RN20)
    return date.today()


TodayDep = Annotated[date, Depends(get_today)]


class AssignmentIn(BaseModel):
    task_id: int
    worker_id: int
    start_date: date


class AssignmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    worker_id: int
    start_date: date
    end_date: date


class AutoAssignOut(BaseModel):
    assigned: list[AssignmentOut]
    unassigned: list[TaskOut]


@router.get("", response_model=list[AssignmentOut])
def list_assignments(session: SessionDep):
    raise NotImplementedError("Req3")


@router.post("", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
def create_assignment(body: AssignmentIn, session: SessionDep, today: TodayDep):
    # 404 si no existe la tarea o el trabajador
    # 422 si start_date < today (RN11)
    # 409 si faltan skills (RN6), la tarea está done (RN8) o ya está asignada (RN9)
    raise NotImplementedError("Req3, Req3a, RN6 a RN11")


@router.post("/auto", response_model=AutoAssignOut)
def auto_assign(session: SessionDep, today: TodayDep):
    # Toma solo tareas not-done sin asignar (RN17) e inicia el siguiente día hábil (RN20)
    raise NotImplementedError("Req4, RN17 a RN21")
