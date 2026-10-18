from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.sql.db import AssignmentRow

URL = "/api/v1/assignments/auto"

# Qué toma la auto-asignación y desde cuándo (ESC-27, ESC-28) se prueba en tests/application.
# Aquí queda el flujo de punta a punta: respuesta HTTP y lo que queda guardado


def assignment_by_task(session: Session) -> dict[int, AssignmentRow]:
    session.expire_all()  # relee de la base lo que haya hecho la API
    return {a.task_id: a for a in session.scalars(select(AssignmentRow))}


def test_esc29_la_respuesta_reporta_las_tareas_que_no_se_pudieron_asignar(
    client: TestClient, session: Session, make_task, make_worker
):
    make_worker("Ana", skills=["python"])
    migrar = make_task("Migrar", 20, ["rust"])

    response = client.post(URL)

    assert response.status_code == 200
    body = response.json()
    assert [t["name"] for t in body["unassigned"]] == ["Migrar"]
    assert migrar.id not in assignment_by_task(session)
