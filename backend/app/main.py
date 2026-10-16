from fastapi import FastAPI
from fastapi.routing import APIRoute

from app.api.v1.router import api_router as api_v1_router

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
    app.include_router(api_v1_router, prefix=API_V1_PREFIX)
    return app


app = create_app()
