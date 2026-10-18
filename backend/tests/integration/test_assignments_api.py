from fastapi.testclient import TestClient

from tests.dates import MON_19, TUE_20, WED_21

URL = "/api/v1/assignments"

# Las reglas de la asignación manual (ESC-17 a ESC-22) se prueban en tests/application.
# Aquí queda el flujo de punta a punta; la traducción de errores a HTTP está en test_errors_api.py


def test_esc16_asignacion_valida_devuelve_las_fechas_calculadas(client: TestClient, make_task, make_worker):
    ana = make_worker("Ana", 6, ["python"])
    api = make_task("API", 10, ["python"])

    response = client.post(URL, json={"task_id": api.id, "worker_id": ana.id, "start_date": MON_19.isoformat()})

    assert response.status_code == 201
    body = response.json()
    assert (body["task_id"], body["worker_id"]) == (api.id, ana.id)
    assert (body["start_date"], body["end_date"]) == (MON_19.isoformat(), TUE_20.isoformat())
    assert client.get(URL).json() == [body]


def test_esc52_mover_y_eliminar_una_asignacion(client: TestClient, make_task, make_worker, make_assignment):
    ana = make_worker("Ana", 6, ["python"])
    assignment = make_assignment(make_task("A", 10, ["python"]), ana, MON_19)
    assignment_url = f"{URL}/{assignment.id}"

    moved = client.put(assignment_url, json={"worker_id": ana.id, "start_date": TUE_20.isoformat()})

    assert moved.status_code == 200
    assert (moved.json()["start_date"], moved.json()["end_date"]) == (TUE_20.isoformat(), WED_21.isoformat())

    assert client.delete(assignment_url).status_code == 204
    assert client.get(URL).json() == []
