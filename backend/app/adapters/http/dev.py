"""Herramientas de desarrollo: Reset y Populate (botones del frontend).

Solo para probar: escriben directo en la base (app/seed.py), sin casos de uso ni reglas de negocio.
"""

from fastapi import APIRouter, status

from app import seed
from app.adapters.http.dependencies import SessionDep

router = APIRouter(prefix="/dev", tags=["dev"])


@router.post("/reset", status_code=status.HTTP_204_NO_CONTENT)
def reset(session: SessionDep):
    seed.reset(session)


@router.post("/populate", status_code=status.HTTP_204_NO_CONTENT)
def populate(session: SessionDep):
    seed.populate(session)
