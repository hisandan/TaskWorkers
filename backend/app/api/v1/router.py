from fastapi import APIRouter

from app.api.v1.endpoints import hello, tasks

api_router = APIRouter()
api_router.include_router(hello.router)
api_router.include_router(tasks.router)
