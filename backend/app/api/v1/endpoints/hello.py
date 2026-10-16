from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.services.hello_service import HelloService

router = APIRouter(prefix="/hello", tags=["hello"])


class HelloResponse(BaseModel):
    message: str


def get_hello_service() -> HelloService:
    return HelloService()


@router.get("", response_model=HelloResponse)
def say_hello(
    service: Annotated[HelloService, Depends(get_hello_service)],
    name: str | None = None,
) -> HelloResponse:
    return HelloResponse(message=service.greet(name))
