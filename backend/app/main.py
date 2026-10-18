from fastapi import FastAPI
from fastapi.routing import APIRoute

from app.adapters.http import assignments, dev, tasks, workers
from app.adapters.http.errors import domain_error_handler
from app.domain.errors import DomainError

API_V1_PREFIX = "/api/v1"


def operation_id(route: APIRoute) -> str:
    # operationId = nombre de la función -> el cliente TS genera `listTasks` en vez de `listTasksApiV1TasksGet`
    return route.name


def create_app() -> FastAPI:
    app = FastAPI(
        title="TaskWorkers API",
        version="0.1.0",
        generate_unique_id_function=operation_id,
    )
    for module in (tasks, workers, assignments, dev):
        app.include_router(module.router, prefix=API_V1_PREFIX)
    # Starlette tipa el handler con `Exception`; solo se registra para DomainError
    app.add_exception_handler(DomainError, domain_error_handler)  # pyright: ignore[reportArgumentType]
    return app


app = create_app()
