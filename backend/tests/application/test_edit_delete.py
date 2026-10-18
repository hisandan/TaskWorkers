import pytest

from app.application.tasks import TaskService
from app.application.workers import WorkerService
from app.domain.errors import HasAssignments
from app.domain.models import Task, Worker
from tests.dates import MON_19, TUE_20
from tests.fakes import InMemoryAssignmentRepository, InMemoryTaskRepository, InMemoryWorkerRepository


@pytest.mark.parametrize("edit", ["skills-del-trabajador", "esfuerzo-de-la-tarea"])
def test_esc30_editar_despues_de_asignar_no_recalcula(
    task_service: TaskService,
    worker_service: WorkerService,
    assignments: InMemoryAssignmentRepository,
    make_task,
    make_worker,
    make_assignment,
    edit,
):
    ana = make_worker("Ana", 6, ["python"])
    api = make_task("API", 10, ["python"])
    make_assignment(api, ana, MON_19, TUE_20, last_day_hours=4)

    if edit == "skills-del-trabajador":
        worker_service.update(ana.id, Worker(name="Ana", availability=6, skills=["sql"]))
    else:
        task_service.update(api.id, Task(name="API", effort=20, skills=["python"]))

    [assignment] = assignments.all()
    assert (assignment.start_date, assignment.end_date) == (MON_19, TUE_20)


def test_esc31_marcar_una_tarea_done_conserva_su_asignacion(
    task_service: TaskService, assignments: InMemoryAssignmentRepository, make_task, make_worker, make_assignment
):
    ana = make_worker("Ana", 6, ["python"])
    api = make_task("API", 10, ["python"])
    make_assignment(api, ana, MON_19, TUE_20, last_day_hours=4)

    task_service.update(api.id, Task(name="API", effort=10, skills=["python"], status="done"))

    [assignment] = assignments.all()
    assert (assignment.start_date, assignment.end_date) == (MON_19, TUE_20)


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
