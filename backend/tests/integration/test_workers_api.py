import pytest
from fastapi.testclient import TestClient

URL = "/api/v1/workers"


def test_esc05_crea_un_trabajador_con_disponibilidad_y_skills(client: TestClient):
    body = {"name": "Ana", "availability": 6, "skills": ["python", "sql"]}

    response = client.post(URL, json=body)

    assert response.status_code == 201
    assert response.json() == {"id": response.json()["id"], **body}


@pytest.mark.parametrize(
    ("availability", "expected"),
    [(0, 422), (25, 422), (4.5, 422), (1, 201), (24, 201)],
    ids=["cero", "mas-de-24", "decimal", "minimo", "maximo"],
)
def test_esc06_valida_el_rango_de_disponibilidad(client: TestClient, availability, expected):
    response = client.post(URL, json={"name": "Ana", "availability": availability, "skills": []})

    assert response.status_code == expected


def test_esc07_crud_completo_de_un_trabajador(client: TestClient):
    created = client.post(URL, json={"name": "Ana", "availability": 6, "skills": ["python"]}).json()
    worker_url = f"{URL}/{created['id']}"

    assert client.get(worker_url).json() == created

    changes = {"name": "Ana María", "availability": 8, "skills": ["python", "sql"]}
    updated = client.put(worker_url, json=changes)
    assert updated.status_code == 200
    assert updated.json() == {"id": created["id"], **changes}

    assert client.get(URL).json() == [updated.json()]

    assert client.delete(worker_url).status_code == 204
    assert client.get(worker_url).status_code == 404
