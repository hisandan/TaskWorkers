import pytest
from fastapi.testclient import TestClient

from tests.dates import FRI_16, MON_19

ASSIGNMENTS = "/api/v1/assignments"
WORKERS = "/api/v1/workers"
MISSING_ID = 999_999

# Las reglas ya se prueban en tests/application; aquí solo que cada error de dominio llegue con su código


@pytest.mark.parametrize(
    ("case", "expected"),
    [
        ("faltan-skills", 409),
        ("tarea-done", 409),
        ("tarea-ya-asignada", 409),
        ("agenda-ocupada", 409),
        ("borrar-trabajador-con-asignaciones", 409),
        ("inicio-en-el-pasado", 422),
        ("tarea-inexistente", 404),
        ("trabajador-inexistente", 404),
    ],
)
def test_esc37_cada_error_de_dominio_responde_su_codigo_http(
    client: TestClient, make_task, make_worker, make_assignment, case, expected
):
    ana = make_worker("Ana", skills=["python"])
    api = make_task("API", skills=["python"])
    reportes = make_task("Reportes", skills=["python", "sql"])
    documentacion = make_task("Documentación", skills=["python"], status="done")
    asignada = make_task("Asignada", 10, ["python"])
    make_assignment(asignada, ana, MON_19)  # ocupa todo el lun 19 y 4 h del mar 20

    def assign(task_id: int, worker_id: int = ana.id, start=MON_19):
        return client.post(ASSIGNMENTS, json={"task_id": task_id, "worker_id": worker_id, "start_date": start.isoformat()})

    requests = {
        "faltan-skills": lambda: assign(reportes.id),
        "tarea-done": lambda: assign(documentacion.id),
        "tarea-ya-asignada": lambda: assign(asignada.id),
        "agenda-ocupada": lambda: assign(api.id),  # el lun 19 de Ana ya está lleno
        "borrar-trabajador-con-asignaciones": lambda: client.delete(f"{WORKERS}/{ana.id}"),
        "inicio-en-el-pasado": lambda: assign(api.id, start=FRI_16),
        "tarea-inexistente": lambda: assign(MISSING_ID),
        "trabajador-inexistente": lambda: assign(api.id, MISSING_ID),
    }

    assert requests[case]().status_code == expected
