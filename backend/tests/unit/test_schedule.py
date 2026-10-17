import pytest

from app.domain import Schedule, schedule
from tests.dates import FRI_16, FRI_23, MON_19, MON_26, SAT_17, SUN_18, TUE_20

AVAILABILITY = 6


def test_esc09_la_tarea_cabe_en_el_dia():
    result = schedule(4, AVAILABILITY, MON_19)

    assert result == Schedule(start=MON_19, end=MON_19, last_day_hours=4)


def test_esc10_la_tarea_ocupa_exactamente_el_dia():
    result = schedule(6, AVAILABILITY, MON_19)

    assert result == Schedule(start=MON_19, end=MON_19, last_day_hours=6)


def test_esc11_la_tarea_cruza_el_fin_de_semana():
    result = schedule(10, AVAILABILITY, FRI_16)

    # vie 6 h + lun 4 h
    assert result == Schedule(start=FRI_16, end=MON_19, last_day_hours=4)


@pytest.mark.parametrize("start", [SAT_17, SUN_18], ids=["sabado", "domingo"])
def test_esc12_si_inicia_en_fin_de_semana_se_mueve_al_lunes(start):
    result = schedule(4, AVAILABILITY, start)

    assert result == Schedule(start=MON_19, end=MON_19, last_day_hours=4)


def test_esc13_la_siguiente_tarea_usa_las_horas_que_sobran_del_dia():
    a = schedule(10, AVAILABILITY, FRI_16)  # termina lun 19 con 4 h usadas

    b = schedule(5, AVAILABILITY, MON_19, after=a)

    # lun 2 h + mar 3 h
    assert b == Schedule(start=MON_19, end=TUE_20, last_day_hours=3)


def test_esc14_si_el_dia_quedo_lleno_la_siguiente_empieza_al_dia_habil_siguiente():
    a = schedule(6, AVAILABILITY, MON_19)

    b = schedule(1, AVAILABILITY, MON_19, after=a)

    assert b == Schedule(start=TUE_20, end=TUE_20, last_day_hours=1)


@pytest.mark.parametrize(
    ("effort", "end", "last_day_hours"),
    [
        pytest.param(30, FRI_23, 6, id="llena-la-semana-exacta"),
        pytest.param(31, MON_26, 1, id="sobra-1h-cruza-fin-de-semana"),
    ],
)
def test_esc15_tarea_de_varios_dias(effort, end, last_day_hours):
    result = schedule(effort, AVAILABILITY, MON_19)

    assert result == Schedule(start=MON_19, end=end, last_day_hours=last_day_hours)
