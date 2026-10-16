from fastapi import FastAPI

from app.api.v1.router import api_router as api_v1_router

API_V1_PREFIX = "/api/v1"


def create_app() -> FastAPI:
    app = FastAPI(title="TaskWorkers API", version="0.1.0")
    app.include_router(api_v1_router, prefix=API_V1_PREFIX)
    return app


app = create_app()
