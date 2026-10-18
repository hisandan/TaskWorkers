from fastapi.testclient import TestClient

from app.seed import TASKS, WORKERS

# Herramientas de desarrollo (botones Reset y Populate del frontend): fuera de las reglas de negocio

URL = "/api/v1"


def test_reset_borra_todo(client: TestClient, make_task, make_worker, make_assignment):
    make_assignment(make_task("API", 10, ["python"]), make_worker("Ana", 6, ["python"]))

    assert client.post(f"{URL}/dev/reset").status_code == 204

    for resource in ("tasks", "workers", "assignments"):
        assert client.get(f"{URL}/{resource}").json() == []


def test_populate_reemplaza_todo_por_los_datos_de_demo(client: TestClient, make_task, make_worker, make_assignment):
    make_assignment(make_task("Vieja", 4), make_worker("Viejo", 8))

    assert client.post(f"{URL}/dev/populate").status_code == 204

    assert [w["name"] for w in client.get(f"{URL}/workers").json()] == [w["name"] for w in WORKERS]
    assert [t["name"] for t in client.get(f"{URL}/tasks").json()] == [t["name"] for t in TASKS]
    assert client.get(f"{URL}/assignments").json() == []

    # Se puede repetir: cada corrida crea filas nuevas
    assert client.post(f"{URL}/dev/populate").status_code == 204
    assert len(client.get(f"{URL}/workers").json()) == len(WORKERS)
