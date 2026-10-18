import pytest

from app.application.assignments import AssignmentService
from app.domain.errors import MissingSkills, StartInPast, StartNotBusinessDay, TaskAlreadyAssigned, TaskDone, WorkerBusy
from tests.dates import FRI_16, MON_19, SAT_24, SUN_25, THU_22, TUE_20, WED_21
from tests.fakes import InMemoryAssignmentRepository


def test_esc17_rechaza_si_al_trabajador_le_faltan_skills(
    assignment_service: AssignmentService, assignments: InMemoryAssignmentRepository, make_task, make_worker
):
    ana = make_worker("Ana", skills=["python"])
    reportes = make_task("Reportes", skills=["python", "sql"])

    with pytest.raises(MissingSkills):
        assignment_service.assign(reportes.id, ana.id, MON_19)

    assert assignments.get_by_task(reportes.id) is None


def test_esc18_una_tarea_sin_skills_la_puede_tomar_cualquiera(assignment_service: AssignmentService, make_task, make_worker):
    luis = make_worker("Luis", skills=[])
    limpieza = make_task("Limpieza", effort=3, skills=[])

    assignment = assignment_service.assign(limpieza.id, luis.id, MON_19)

    assert (assignment.task_id, assignment.worker_id) == (limpieza.id, luis.id)


def test_esc19_rechaza_asignar_una_tarea_done(assignment_service: AssignmentService, make_task, make_worker):
    ana = make_worker("Ana", skills=["python"])
    api = make_task("API", skills=["python"], status="done")

    with pytest.raises(TaskDone):
        assignment_service.assign(api.id, ana.id, MON_19)


@pytest.mark.parametrize("target", ["Luis", "Ana"], ids=["otro-compatible", "el-mismo"])
def test_esc20_rechaza_asignar_una_tarea_ya_asignada(
    assignment_service: AssignmentService,
    assignments: InMemoryAssignmentRepository,
    make_task,
    make_worker,
    make_assignment,
    target,
):
    workers = {"Ana": make_worker("Ana", skills=["python"]), "Luis": make_worker("Luis", skills=["python"])}
    api = make_task("API", skills=["python"])
    original = make_assignment(api, workers["Ana"])

    with pytest.raises(TaskAlreadyAssigned):
        assignment_service.assign(api.id, workers[target].id, MON_19)

    assert assignments.all() == [original]
    assert original.worker_id == workers["Ana"].id


def test_esc21_rechaza_una_fecha_de_inicio_en_el_pasado(assignment_service: AssignmentService, make_task, make_worker):
    ana = make_worker("Ana", skills=["python"])
    api = make_task("API", skills=["python"])

    with pytest.raises(StartInPast):
        assignment_service.assign(api.id, ana.id, FRI_16)


def test_esc21_permite_iniciar_hoy(assignment_service: AssignmentService, make_task, make_worker):
    ana = make_worker("Ana", skills=["python"])
    api = make_task("API", skills=["python"])

    assignment = assignment_service.assign(api.id, ana.id, MON_19)

    assert assignment.start_date == MON_19


@pytest.mark.parametrize("start", [SAT_24, SUN_25], ids=["sabado", "domingo"])
def test_esc22_rechaza_si_el_inicio_cae_en_fin_de_semana(
    assignment_service: AssignmentService, assignments: InMemoryAssignmentRepository, make_task, make_worker, start
):
    ana = make_worker("Ana", 6, ["python"])
    api = make_task("API", 4, ["python"])

    with pytest.raises(StartNotBusinessDay):
        assignment_service.assign(api.id, ana.id, start)
    assert assignments.all() == []


def test_esc40_asignar_en_medio_de_la_agenda_corre_el_fin_de_las_siguientes(
    assignment_service: AssignmentService, make_task, make_worker, make_assignment
):
    ana = make_worker("Ana", 6, ["python"])
    b = make_task("B", 4, ["python"])
    c = make_task("C", 6, ["python"])
    make_assignment(b, ana, TUE_20)
    make_assignment(c, ana, WED_21)
    a = make_task("A", 10, ["python"])

    assignment = assignment_service.assign(a.id, ana.id, MON_19)

    assert (assignment.start_date, assignment.end_date) == (MON_19, TUE_20)
    dates = {x.task_id: (x.start_date, x.end_date) for x in assignment_service.all()}
    assert dates == {a.id: (MON_19, TUE_20), b.id: (TUE_20, WED_21), c.id: (WED_21, THU_22)}


@pytest.mark.parametrize("case", ["corre-a-la-siguiente", "dia-lleno"])
def test_esc41_rechaza_si_alguna_tarea_pierde_su_dia_de_inicio(
    assignment_service: AssignmentService,
    assignments: InMemoryAssignmentRepository,
    make_task,
    make_worker,
    make_assignment,
    case,
):
    ana = make_worker("Ana", 6, ["python"])
    if case == "corre-a-la-siguiente":
        make_assignment(make_task("B", 4, ["python"]), ana, TUE_20)
        new = make_task("A", 12, ["python"])  # llena lun y mar: B pierde el mar 20
    else:
        make_assignment(make_task("X", 6, ["python"]), ana, MON_19)
        new = make_task("Y", 1, ["python"])  # el lun 19 ya está lleno: Y no trabaja ese día

    with pytest.raises(WorkerBusy):
        assignment_service.assign(new.id, ana.id, MON_19)

    assert assignments.get_by_task(new.id) is None
