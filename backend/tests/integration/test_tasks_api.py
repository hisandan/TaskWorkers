from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db import Task


def test_list_tasks_empty(client: TestClient):
    response = client.get("/api/v1/tasks")

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "page": 1, "size": 10}


def test_list_tasks_paginates(client: TestClient, session: Session):
    session.add_all([Task(name=f"task {i}") for i in range(3)])
    session.flush()

    response = client.get("/api/v1/tasks", params={"page": 2, "size": 2})

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert [t["name"] for t in body["items"]] == ["task 2"]
