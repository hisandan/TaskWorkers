"""Traduce los errores de dominio a códigos HTTP (convención en docs/testing.md)."""

from fastapi import Request
from fastapi.responses import JSONResponse

from app.domain.errors import Conflict, DomainError, InvalidInput, NotFound

STATUS_BY_ERROR: dict[type[DomainError], int] = {
    NotFound: 404,
    Conflict: 409,  # choca con el estado actual de los datos
    InvalidInput: 422,  # el dato es inválido por sí solo
}


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    status_code = next(code for error, code in STATUS_BY_ERROR.items() if isinstance(exc, error))
    return JSONResponse(status_code=status_code, content={"detail": str(exc)})
