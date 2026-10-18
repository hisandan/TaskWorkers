from app.domain.rules import Schedule, Slot, agenda, late_starts
from tests.dates import FRI_16, MON_19, THU_22, TUE_20, WED_21

AVAILABILITY = 6

# Agenda de "Ana" (6 h/día): B (4 h) inicia mar 20 y C (6 h) inicia mié 21.
# A se asigna después con inicio lun 19, así que va de última en la lista pero primera en la agenda


def slots(effort_a: int) -> list[Slot]:
    return [
        Slot(task_id=2, effort=4, start=TUE_20),  # B
        Slot(task_id=3, effort=6, start=WED_21),  # C
        Slot(task_id=1, effort=effort_a, start=MON_19),  # A
    ]


def test_esc38_la_agenda_se_ordena_por_inicio_y_corre_el_fin_de_las_siguientes():
    result = agenda(slots(effort_a=10), AVAILABILITY)

    assert result == {
        1: Schedule(start=MON_19, end=TUE_20, last_day_hours=4),  # lun 6 h + mar 4 h
        2: Schedule(start=TUE_20, end=WED_21, last_day_hours=2),  # mar 2 h + mié 2 h
        3: Schedule(start=WED_21, end=THU_22, last_day_hours=2),  # mié 4 h + jue 2 h
    }


def test_esc39_detecta_las_tareas_que_pierden_su_dia_de_inicio():
    # A de 12 h llena lun y mar: B ya no trabaja ninguna hora el mar 20
    assert late_starts(slots(effort_a=12), AVAILABILITY) == [2]


def test_esc39_basta_una_hora_en_el_dia_de_inicio():
    # A de 11 h deja 1 h libre el mar 20: B la usa y conserva su día de inicio
    assert late_starts(slots(effort_a=11), AVAILABILITY) == []


def test_esc39_si_inician_el_mismo_dia_la_ultima_asignada_va_despues():
    existing = Slot(task_id=1, effort=6, start=MON_19)
    new = Slot(task_id=2, effort=1, start=MON_19)

    assert late_starts([existing, new], AVAILABILITY) == [2]


def test_esc46_revisa_toda_la_agenda_no_solo_la_tarea_siguiente():
    # B trabaja mar 2 h y mié 6 h: conserva su día, pero C ya no tiene horas el mié 21
    b = Slot(task_id=2, effort=8, start=TUE_20)
    c = Slot(task_id=3, effort=2, start=WED_21)
    a = Slot(task_id=1, effort=10, start=MON_19)

    assert late_starts([b, c, a], AVAILABILITY) == [3]


def test_esc46_un_hueco_libre_absorbe_el_corrimiento():
    b = Slot(task_id=2, effort=4, start=THU_22)
    a = Slot(task_id=1, effort=10, start=MON_19)

    assert late_starts([b, a], AVAILABILITY) == []
    assert agenda([b, a], AVAILABILITY)[2] == Schedule(start=THU_22, end=THU_22, last_day_hours=4)


def test_esc46_el_dia_puede_venir_lleno_desde_antes():
    # X llena vie 16 y lun 19; Y no puede ir antes porque X no se interrumpe
    x = Slot(task_id=1, effort=12, start=FRI_16)
    y = Slot(task_id=2, effort=1, start=MON_19)

    assert late_starts([x, y], AVAILABILITY) == [2]
