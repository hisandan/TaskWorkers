import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import Assignment
from tests.dates import MON_19, TUE_20

TASKS = "/api/v1/tasks"
WORKERS = "/api/v1/workers"


def only_assignment(session: Session) -> Assignment:
    session.expire_all()  # relee de la base lo que haya hecho la API
    return session.scalars(select(Assignment)).one()


@pytest.mark.parametrize("edit", ["skills-del-trabajador", "esfuerzo-de-la-tarea"])
def test_esc30_editar_despues_de_asignar_no_recalcula(
    client: TestClient, session: Session, make_task, make_worker, make_assignment, edit
):
    ana = make_worker("Ana", 6, ["python"])
    api = make_task("API", 10, ["python"])
    make_assignment(api, ana, MON_19, TUE_20, last_day_hours=4)

    if edit == "skills-del-trabajador":
        response = client.put(f"{WORKERS}/{ana.id}", json={"name": "Ana", "availability": 6, "skills": ["sql"]})
    else:
        response = client.put(f"{TASKS}/{api.id}", json={"name": "API", "effort": 20, "skills": ["python"]})

    assert response.status_code == 200
    assignment = only_assignment(session)
    assert (assignment.start_date, assignment.end_date) == (MON_19, TUE_20)


def test_esc31_marcar_una_tarea_done_conserva_su_asignacion(
    client: TestClient, session: Session, make_task, make_worker, make_assignment
):
    ana = make_worker("Ana", 6, ["python"])
    api = make_task("API", 10, ["python"])
    make_assignment(api, ana, MON_19, TUE_20, last_day_hours=4)

    response = client.put(f"{TASKS}/{api.id}", json={"name": "API", "effort": 10, "skills": ["python"], "status": "done"})

    assert response.status_code == 200
    assignment = only_assignment(session)
    assert (assignment.start_date, assignment.end_date) == (MON_19, TUE_20)


@pytest.mark.parametrize(
    ("entity", "with_assignment", "expected"),
    [
        ("worker", True, 409),
        ("task", True, 409),
        ("worker", False, 204),
        ("task", False, 204),
    ],
    ids=["trabajador-con-asignaciones", "tarea-con-asignacion", "trabajador-sin-asignaciones", "tarea-sin-asignacion"],
)
def test_esc32_no_se_borra_lo_que_tiene_asignaciones(
    client: TestClient, make_task, make_worker, make_assignment, entity, with_assignment, expected
):
    ana = make_worker("Ana", skills=["python"])
    api = make_task("API", skills=["python"])
    if with_assignment:
        make_assignment(api, ana)

    url = f"{WORKERS}/{ana.id}" if entity == "worker" else f"{TASKS}/{api.id}"

    assert client.delete(url).status_code == expected
