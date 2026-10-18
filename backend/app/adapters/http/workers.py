"""Req2: CRUD de trabajadores. Sin lógica: traduce HTTP <-> WorkerService."""

from fastapi import APIRouter, status
from pydantic import BaseModel, ConfigDict

from app.adapters.http.dependencies import WorkerServiceDep
from app.domain.models import Worker

router = APIRouter(prefix="/workers", tags=["workers"])


class WorkerIn(BaseModel):
    name: str
    availability: int  # TODO RN4: entero entre 1 y 24 (horas/día)
    skills: list[str] = []

    def to_domain(self) -> Worker:
        return Worker(name=self.name, availability=self.availability, skills=self.skills)


class WorkerOut(WorkerIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


@router.get("", response_model=list[WorkerOut])
def list_workers(service: WorkerServiceDep):
    return service.all()


@router.post("", response_model=WorkerOut, status_code=status.HTTP_201_CREATED)
def create_worker(body: WorkerIn, service: WorkerServiceDep):
    return service.create(body.to_domain())


@router.get("/{worker_id}", response_model=WorkerOut)
def get_worker(worker_id: int, service: WorkerServiceDep):
    return service.get(worker_id)


@router.put("/{worker_id}", response_model=WorkerOut)
def update_worker(worker_id: int, body: WorkerIn, service: WorkerServiceDep):
    return service.update(worker_id, body.to_domain())


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(worker_id: int, service: WorkerServiceDep):
    service.delete(worker_id)
