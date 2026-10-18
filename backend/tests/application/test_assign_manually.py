import pytest

from app.application.assignments import AssignmentService
from app.domain.errors import MissingSkills, StartInPast, TaskAlreadyAssigned, TaskDone
from tests.dates import FRI_16, MON_19, MON_26, SAT_24
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


def test_esc22_si_el_inicio_cae_en_fin_de_semana_arranca_el_lunes(
    assignment_service: AssignmentService, make_task, make_worker
):
    ana = make_worker("Ana", 6, ["python"])
    api = make_task("API", 4, ["python"])

    assignment = assignment_service.assign(api.id, ana.id, SAT_24)

    assert (assignment.start_date, assignment.end_date) == (MON_26, MON_26)
