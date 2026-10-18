import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.adapters.sql.db import TaskRow

URL = "/api/v1/tasks"


def test_esc01_una_tarea_nueva_nace_not_done(client: TestClient):
    response = client.post(URL, json={"name": "API", "effort": 10, "skills": ["python"]})

    assert response.status_code == 201
    assert response.json()["status"] == "not-done"


@pytest.mark.parametrize("effort", [0, -3, 2.5], ids=["cero", "negativo", "decimal"])
def test_esc02_rechaza_un_esfuerzo_invalido(client: TestClient, session: Session, effort):
    response = client.post(URL, json={"name": "API", "effort": effort, "skills": []})

    assert response.status_code == 422
    assert session.scalar(select(func.count()).select_from(TaskRow)) == 0


def test_esc03_rechaza_un_estado_fuera_de_done_not_done(client: TestClient, make_task):
    task = make_task()
    body = {"name": "API", "effort": 10, "skills": [], "status": "in-progress"}

    assert client.post(URL, json=body).status_code == 422
    assert client.put(f"{URL}/{task.id}", json=body).status_code == 422


def test_esc04_crud_completo_de_una_tarea(client: TestClient):
    created = client.post(URL, json={"name": "API", "effort": 10, "skills": ["python"]}).json()
    task_url = f"{URL}/{created['id']}"

    assert client.get(task_url).json() == created

    changes = {"name": "API v2", "effort": 12, "skills": ["python", "sql"], "status": "done"}
    updated = client.put(task_url, json=changes)
    assert updated.status_code == 200
    assert updated.json() == {"id": created["id"], **changes}

    assert client.get(URL).json() == [updated.json()]

    assert client.delete(task_url).status_code == 204
    assert client.get(task_url).status_code == 404
