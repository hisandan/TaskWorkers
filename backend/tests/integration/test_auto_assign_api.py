from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import Assignment
from tests.dates import MON_19, MON_26, SAT_24

URL = "/api/v1/assignments/auto"


def assignment_by_task(session: Session) -> dict[int, Assignment]:
    session.expire_all()  # relee de la base lo que haya hecho la API
    return {a.task_id: a for a in session.scalars(select(Assignment))}


def test_esc27_asigna_solo_las_pendientes_y_no_toca_las_existentes(
    client: TestClient, session: Session, make_task, make_worker, make_assignment
):
    ana = make_worker("Ana", skills=["python"])
    t1 = make_task("T1", 4, ["python"])
    t2 = make_task("T2", 4, ["python"])
    t3 = make_task("T3", 4, ["python"])
    t4 = make_task("T4", 4, ["python"], status="done")
    original = make_assignment(t3, ana, MON_19, MON_19, last_day_hours=4)

    response = client.post(URL)

    assert response.status_code == 200
    by_task = assignment_by_task(session)
    assert t1.id in by_task and t2.id in by_task
    assert by_task[t3.id] == original
    assert (original.start_date, original.end_date) == (MON_19, MON_19)
    assert t4.id not in by_task


def test_esc28_la_fecha_de_inicio_es_el_siguiente_dia_habil(client: TestClient, set_today, make_task, make_worker):
    set_today(SAT_24)
    make_worker("Ana", skills=["python"])
    make_task("API", 4, ["python"])

    response = client.post(URL)

    assert response.status_code == 200
    [assigned] = response.json()["assigned"]
    assert assigned["start_date"] == MON_26.isoformat()


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
