"""Req3, Req3a: asignación manual. Req4: auto-asignación. Sin lógica: traduce HTTP <-> AssignmentService."""

from datetime import date

from fastapi import APIRouter, status
from pydantic import BaseModel, ConfigDict

from app.adapters.http.dependencies import AssignmentServiceDep
from app.adapters.http.tasks import TaskOut

router = APIRouter(prefix="/assignments", tags=["assignments"])


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
def list_assignments(service: AssignmentServiceDep):
    return service.all()


@router.post("", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
def create_assignment(body: AssignmentIn, service: AssignmentServiceDep):
    return service.assign(body.task_id, body.worker_id, body.start_date)


@router.post("/auto", response_model=AutoAssignOut)
def auto_assign(service: AssignmentServiceDep):
    return service.auto_assign()
