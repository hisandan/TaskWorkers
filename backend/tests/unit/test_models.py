import pytest

from app.domain.errors import InvalidAvailability, InvalidEffort, InvalidStatus
from app.domain.models import Task, Worker


@pytest.mark.parametrize("effort", [0, -3, 2.5], ids=["cero", "negativo", "decimal"])
def test_esc02_el_dominio_rechaza_un_esfuerzo_invalido(effort):
    with pytest.raises(InvalidEffort):
        Task(name="API", effort=effort)


def test_esc03_el_dominio_rechaza_un_estado_fuera_de_done_not_done():
    with pytest.raises(InvalidStatus):
        Task(name="API", effort=10, status="in-progress")


@pytest.mark.parametrize(
    "availability", [0, 25, 4.5], ids=["cero", "mas-de-24", "decimal"]
)
def test_esc06_el_dominio_rechaza_una_disponibilidad_fuera_de_rango(availability):
    with pytest.raises(InvalidAvailability):
        Worker(name="Ana", availability=availability)


@pytest.mark.parametrize("availability", [1, 24], ids=["minimo", "maximo"])
def test_esc06_el_dominio_acepta_los_extremos_de_disponibilidad(availability):
    assert Worker(name="Ana", availability=availability).availability == availability
