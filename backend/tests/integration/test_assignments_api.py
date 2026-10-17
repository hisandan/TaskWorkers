from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import Assignment, Task, Worker
from tests.dates import FRI_16, MON_19, MON_26, SAT_24, TUE_20

URL = "/api/v1/assignments"


def assign(client: TestClient, task: Task, worker: Worker, start: date = MON_19):
    return client.post(URL, json={"task_id": task.id, "worker_id": worker.id, "start_date": start.isoformat()})


def assignments_of(session: Session, task: Task) -> list[Assignment]:
    session.expire_all()  # relee de la base lo que haya hecho la API
    return list(session.scalars(select(Assignment).where(Assignment.task_id == task.id)))


def test_esc16_asignacion_valida_devuelve_las_fechas_calculadas(client: TestClient, make_task, make_worker):
    ana = make_worker("Ana", 6, ["python"])
    api = make_task("API", 10, ["python"])

    response = assign(client, api, ana, MON_19)

    assert response.status_code == 201
    body = response.json()
    assert (body["task_id"], body["worker_id"]) == (api.id, ana.id)
    assert (body["start_date"], body["end_date"]) == (MON_19.isoformat(), TUE_20.isoformat())


def test_esc17_rechaza_si_al_trabajador_le_faltan_skills(client: TestClient, session: Session, make_task, make_worker):
    ana = make_worker("Ana", skills=["python"])
    reportes = make_task("Reportes", skills=["python", "sql"])

    response = assign(client, reportes, ana)

    assert response.status_code == 409
    assert assignments_of(session, reportes) == []


def test_esc18_una_tarea_sin_skills_la_puede_tomar_cualquiera(client: TestClient, make_task, make_worker):
    luis = make_worker("Luis", skills=[])
    limpieza = make_task("Limpieza", effort=3, skills=[])

    assert assign(client, limpieza, luis).status_code == 201


def test_esc19_rechaza_asignar_una_tarea_done(client: TestClient, make_task, make_worker):
    ana = make_worker("Ana", skills=["python"])
    api = make_task("API", skills=["python"], status="done")

    assert assign(client, api, ana).status_code == 409


@pytest.mark.parametrize("target", ["Luis", "Ana"], ids=["otro-compatible", "el-mismo"])
def test_esc20_rechaza_asignar_una_tarea_ya_asignada(
    client: TestClient, session: Session, make_task, make_worker, make_assignment, target
):
    workers = {"Ana": make_worker("Ana", skills=["python"]), "Luis": make_worker("Luis", skills=["python"])}
    api = make_task("API", skills=["python"])
    original = make_assignment(api, workers["Ana"])

    response = assign(client, api, workers[target])

    assert response.status_code == 409
    assert assignments_of(session, api) == [original]
    assert original.worker_id == workers["Ana"].id


@pytest.mark.parametrize(("start", "expected"), [(FRI_16, 422), (MON_19, 201)], ids=["ayer", "hoy"])
def test_esc21_la_fecha_de_inicio_no_puede_estar_en_el_pasado(client: TestClient, make_task, make_worker, start, expected):
    ana = make_worker("Ana", skills=["python"])
    api = make_task("API", skills=["python"])

    assert assign(client, api, ana, start).status_code == expected


def test_esc22_si_el_inicio_cae_en_fin_de_semana_arranca_el_lunes(client: TestClient, make_task, make_worker):
    ana = make_worker("Ana", 6, ["python"])
    api = make_task("API", 4, ["python"])

    response = assign(client, api, ana, SAT_24)

    assert response.status_code == 201
    body = response.json()
    assert (body["start_date"], body["end_date"]) == (MON_26.isoformat(), MON_26.isoformat())
