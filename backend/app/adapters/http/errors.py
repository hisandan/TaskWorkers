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
    # `code` = nombre del error (MissingSkills, WorkerBusy, ...): el frontend lo traduce a un mensaje
    return JSONResponse(status_code=status_code, content={"detail": str(exc), "code": type(exc).__name__})
