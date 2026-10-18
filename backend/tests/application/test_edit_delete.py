import pytest

from app.application.assignments import AssignmentService
from app.application.tasks import TaskService
from app.application.workers import WorkerService
from app.domain.errors import HasAssignments, MissingSkills, WorkerBusy
from app.domain.models import Task, Worker
from tests.dates import MON_19, THU_22, TUE_20
from tests.fakes import InMemoryTaskRepository, InMemoryWorkerRepository


@pytest.mark.parametrize(
    ("edit", "end"),
    [
        pytest.param("esfuerzo-de-la-tarea", THU_22, id="esfuerzo-20h"),  # 6 + 6 + 6 + 2
        pytest.param("disponibilidad-del-trabajador", MON_19, id="disponibilidad-10h"),
    ],
)
def test_esc30_editar_despues_de_asignar_recalcula_las_fechas(
    task_service: TaskService,
    worker_service: WorkerService,
    assignment_service: AssignmentService,
    make_task,
    make_worker,
    make_assignment,
    edit,
    end,
):
    ana = make_worker("Ana", 6, ["python"])
    api = make_task("API", 10, ["python"])
    make_assignment(api, ana, MON_19)

    if edit == "esfuerzo-de-la-tarea":
        task_service.update(api.id, Task(name="API", effort=20, skills=["python"]))
    else:
        worker_service.update(ana.id, Worker(name="Ana", availability=10, skills=["python"]))

    [assignment] = assignment_service.all()
    assert (assignment.start_date, assignment.end_date) == (MON_19, end)


def test_esc31_marcar_una_tarea_done_conserva_su_asignacion(
    task_service: TaskService, assignment_service: AssignmentService, make_task, make_worker, make_assignment
):
    ana = make_worker("Ana", 6, ["python"])
    api = make_task("API", 10, ["python"])
    make_assignment(api, ana, MON_19)

    task_service.update(api.id, Task(name="API", effort=10, skills=["python"], status="done"))

    [assignment] = assignment_service.all()
    assert (assignment.start_date, assignment.end_date) == (MON_19, TUE_20)


@pytest.mark.parametrize(
    ("edit", "error"),
    [
        ("esfuerzo-de-la-tarea", WorkerBusy),
        ("skills-de-la-tarea", MissingSkills),
        ("skills-del-trabajador", MissingSkills),
        ("disponibilidad-del-trabajador", WorkerBusy),
    ],
)
def test_esc42_rechaza_editar_si_rompe_las_skills_o_la_agenda(
    task_service: TaskService,
    worker_service: WorkerService,
    tasks: InMemoryTaskRepository,
    workers: InMemoryWorkerRepository,
    make_task,
    make_worker,
    make_assignment,
    edit,
    error,
):
    # API termina el mar 20 con 4 h usadas; Siguiente usa las 2 h que sobran ese día
    ana = make_worker("Ana", 6, ["python"])
    api = make_task("API", 10, ["python"])
    make_assignment(api, ana, MON_19)
    make_assignment(make_task("Siguiente", 4, ["python"]), ana, TUE_20)

    edits = {
        # 12 h llenan lun y mar: Siguiente pierde el mar 20
        "esfuerzo-de-la-tarea": lambda: task_service.update(api.id, Task(name="API", effort=12, skills=["python"])),
        "skills-de-la-tarea": lambda: task_service.update(api.id, Task(name="API", effort=10, skills=["python", "sql"])),
        "skills-del-trabajador": lambda: worker_service.update(ana.id, Worker(name="Ana", availability=6, skills=["sql"])),
        # 5 h/día: API usa lun 5 h y mar 5 h, y Siguiente pierde el mar 20
        "disponibilidad-del-trabajador": lambda: worker_service.update(
            ana.id, Worker(name="Ana", availability=5, skills=["python"])
        ),
    }

    with pytest.raises(error):
        edits[edit]()

    assert tasks.get(api.id) == Task(id=api.id, name="API", effort=10, skills=["python"])
    assert workers.get(ana.id) == Worker(id=ana.id, name="Ana", availability=6, skills=["python"])


@pytest.mark.parametrize("entity", ["worker", "task"], ids=["trabajador-con-asignaciones", "tarea-con-asignacion"])
def test_esc32_no_se_borra_lo_que_tiene_asignaciones(
    task_service: TaskService, worker_service: WorkerService, make_task, make_worker, make_assignment, entity
):
    ana = make_worker("Ana", skills=["python"])
    api = make_task("API", skills=["python"])
    make_assignment(api, ana)

    with pytest.raises(HasAssignments):
        if entity == "worker":
            worker_service.delete(ana.id)
        else:
            task_service.delete(api.id)


@pytest.mark.parametrize("entity", ["worker", "task"], ids=["trabajador-sin-asignaciones", "tarea-sin-asignacion"])
def test_esc32_se_borra_lo_que_no_tiene_asignaciones(
    task_service: TaskService,
    worker_service: WorkerService,
    tasks: InMemoryTaskRepository,
    workers: InMemoryWorkerRepository,
    make_task,
    make_worker,
    entity,
):
    ana = make_worker("Ana", skills=["python"])
    api = make_task("API", skills=["python"])

    if entity == "worker":
        worker_service.delete(ana.id)
        assert workers.get(ana.id) is None
    else:
        task_service.delete(api.id)
        assert tasks.get(api.id) is None
