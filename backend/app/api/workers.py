"""Req2: CRUD de trabajadores."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.db import get_session

router = APIRouter(prefix="/workers", tags=["workers"])

SessionDep = Annotated[Session, Depends(get_session)]


class WorkerIn(BaseModel):
    name: str
    availability: int  # TODO RN4: entero entre 1 y 24 (horas/día)
    skills: list[str] = []


class WorkerOut(WorkerIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


@router.get("", response_model=list[WorkerOut])
def list_workers(session: SessionDep):
    raise NotImplementedError("Req2")


@router.post("", response_model=WorkerOut, status_code=status.HTTP_201_CREATED)
def create_worker(body: WorkerIn, session: SessionDep):
    raise NotImplementedError("Req2")


@router.get("/{worker_id}", response_model=WorkerOut)
def get_worker(worker_id: int, session: SessionDep):
    raise NotImplementedError("Req2")


@router.put("/{worker_id}", response_model=WorkerOut)
def update_worker(worker_id: int, body: WorkerIn, session: SessionDep):
    raise NotImplementedError("Req2, RN22")


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(worker_id: int, session: SessionDep):
    raise NotImplementedError("Req2, RN24")
