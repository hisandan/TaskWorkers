from app.domain.models import Schedule, Task, Worker
from app.domain.rules import auto_assign
from tests.dates import MON_19, TUE_20, WED_21


def test_esc23_elige_al_que_termina_antes_segun_su_agenda():
    ana = Worker(id=1, name="Ana", availability=6, skills=["python"])
    luis = Worker(id=2, name="Luis", availability=6, skills=["python"])
    task = Task(id=1, name="API", effort=6, skills=["python"])
    agendas = {ana.id: Schedule(start=MON_19, end=WED_21, last_day_hours=6)}

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
