import pytest

from app.domain.models import Task, Worker
from app.domain.rules import Slot, auto_assign
from tests.dates import FRI_23, MON_19, THU_22, TUE_20, TUE_27


def test_esc23_elige_al_que_termina_antes_segun_su_agenda():
    ana = Worker(id=1, name="Ana", availability=6, skills=["python"])
    luis = Worker(id=2, name="Luis", availability=6, skills=["python"])
    task = Task(id=1, name="API", effort=6, skills=["python"])
    agendas = {ana.pk: [Slot(task_id=99, effort=18, start=MON_19)]}  # ocupada lun 19 a mié 21

    result = auto_assign([task], [ana, luis], MON_19, agendas)

    [planned] = result.assigned
    assert planned.worker is luis
    assert planned.schedule.end == MON_19


def test_esc24_elige_al_que_termina_antes_segun_su_disponibilidad():
    ana = Worker(id=1, name="Ana", availability=8, skills=["python"])
    luis = Worker(id=2, name="Luis", availability=4, skills=["python"])
    task = Task(id=1, name="API", effort=8, skills=["python"])

    result = auto_assign([task], [ana, luis], MON_19)

    # Ana termina lun 19; Luis terminaría mar 20
    [planned] = result.assigned
    assert planned.worker is ana
    assert planned.schedule.end == MON_19


def test_esc25_la_agenda_se_actualiza_dentro_de_la_misma_corrida():
    ana = Worker(id=1, name="Ana", availability=6, skills=["python"])
    luis = Worker(id=2, name="Luis", availability=6, skills=["python"])
    t1 = Task(id=1, name="T1", effort=6, skills=["python"])
    t2 = Task(id=2, name="T2", effort=6, skills=["python"])

    result = auto_assign([t1, t2], [ana, luis], MON_19)

    assert len(result.assigned) == 2
    assert {p.worker.id for p in result.assigned} == {ana.id, luis.id}
    assert all(p.schedule.end == MON_19 for p in result.assigned)


def test_esc26_si_nadie_tiene_las_skills_la_tarea_queda_sin_asignar():
    ana = Worker(id=1, name="Ana", availability=6, skills=["python"])
    task = Task(id=1, name="Migrar", effort=6, skills=["rust"])

    result = auto_assign([task], [ana], MON_19)

    assert result.assigned == []
    assert result.unassigned == [task]


def test_esc43_recorre_primero_las_tareas_con_menos_candidatos():
    # Por id, "Genérica" iría primero, Luis (menor id) la tomaría y "Especial" terminaría el mar 20
    luis = Worker(id=1, name="Luis", availability=6, skills=["python", "rust"])
    ana = Worker(id=2, name="Ana", availability=6, skills=["python"])
    generica = Task(id=1, name="Genérica", effort=6, skills=["python"])
    especial = Task(id=2, name="Especial", effort=6, skills=["rust"])

    result = auto_assign([generica, especial], [luis, ana], MON_19)

    by_task = {p.task.id: p for p in result.assigned}
    assert by_task[especial.id].worker is luis
    assert by_task[generica.id].worker is ana
    assert all(p.schedule.end == MON_19 for p in result.assigned)


def test_esc44_si_tienen_los_mismos_candidatos_va_primero_la_de_menor_id():
    ana = Worker(id=1, name="Ana", availability=6, skills=["python"])
    t1 = Task(id=1, name="T1", effort=6, skills=["python"])
    t2 = Task(id=2, name="T2", effort=6, skills=["python"])

    result = auto_assign([t2, t1], [ana], MON_19)

    by_task = {p.task.id: p for p in result.assigned}
    assert by_task[t1.id].schedule.end == MON_19
    assert by_task[t2.id].schedule.end == TUE_20


def test_esc45_si_dos_candidatos_terminan_el_mismo_dia_gana_el_de_menor_id():
    ana = Worker(id=2, name="Ana", availability=6, skills=["python"])
    luis = Worker(id=1, name="Luis", availability=6, skills=["python"])
    task = Task(id=1, name="API", effort=6, skills=["python"])

    result = auto_assign([task], [ana, luis], MON_19)

    [planned] = result.assigned
    assert planned.worker is luis


@pytest.mark.parametrize(
    ("effort", "start", "end"),
    [
        pytest.param(4, TUE_20, TUE_20, id="cabe-en-el-hueco"),
        pytest.param(14, TUE_20, THU_22, id="corre-el-fin-de-f-sin-quitarle-su-dia"),
        pytest.param(18, FRI_23, TUE_27, id="en-el-hueco-f-perderia-su-dia-va-despues"),
    ],
)
def test_esc50_usa_el_hueco_libre_antes_de_una_tarea_futura(effort, start, end):
    ana = Worker(id=1, name="Ana", availability=6, skills=["python"])
    task = Task(id=1, name="T", effort=effort, skills=["python"])
    agendas = {ana.pk: [Slot(task_id=99, effort=6, start=THU_22)]}  # F: libre mar 20 y mié 21

    result = auto_assign([task], [ana], TUE_20, agendas)

    [planned] = result.assigned
    assert (planned.schedule.start, planned.schedule.end) == (start, end)


def test_esc50_el_hueco_cuenta_para_elegir_al_que_termina_antes():
    # Si la tarea fuera al final de la agenda, Ana terminaría el vie 23 y ganaría Luis (mié 21)
    luis = Worker(id=1, name="Luis", availability=4, skills=["python"])
    ana = Worker(id=2, name="Ana", availability=6, skills=["python"])
    task = Task(id=1, name="T", effort=6, skills=["python"])
    agendas = {ana.pk: [Slot(task_id=99, effort=6, start=THU_22)]}

    result = auto_assign([task], [luis, ana], TUE_20, agendas)

    [planned] = result.assigned
    assert planned.worker is ana
    assert planned.schedule.end == TUE_20
