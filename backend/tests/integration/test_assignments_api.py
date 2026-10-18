from fastapi.testclient import TestClient

from tests.dates import MON_19, TUE_20

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
