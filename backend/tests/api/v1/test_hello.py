from fastapi.testclient import TestClient

from app.main import app
from app.services.hello_service import HelloService

client = TestClient(app)


def test_greet_default() -> None:
    assert HelloService().greet() == "Hello, World!"


def test_greet_with_name() -> None:
    assert HelloService().greet("Ana") == "Hello, Ana!"


def test_hello_endpoint() -> None:
    response = client.get("/api/v1/hello")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}


def test_hello_endpoint_with_name() -> None:
    response = client.get("/api/v1/hello", params={"name": "Ana"})
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, Ana!"}
