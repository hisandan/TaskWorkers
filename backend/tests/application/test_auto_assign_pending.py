import pytest

from app.application.assignments import AssignmentService
from tests.dates import FRI_23, MON_19, MON_26, SAT_24, TUE_20
from tests.fakes import FixedClock, InMemoryAssignmentRepository


def test_esc27_asigna_solo_las_pendientes_y_no_toca_las_existentes(
    assignment_service: AssignmentService,
    assignments: InMemoryAssignmentRepository,
    make_task,
    make_worker,
    make_assignment,
):
    ana = make_worker("Ana", skills=["python"])
    t1 = make_task("T1", 4, ["python"])
    t2 = make_task("T2", 4, ["python"])
    t3 = make_task("T3", 4, ["python"])
    t4 = make_task("T4", 4, ["python"], status="done")
    original = make_assignment(t3, ana, MON_19)

    report = assignment_service.auto_assign()

    assert {a.task_id for a in report.assigned} == {t1.id, t2.id}
    assert assignments.get_by_task(t1.id) is not None and assignments.get_by_task(t2.id) is not None
    assert assignments.get_by_task(t3.id) is original
    assert original.start_date == MON_19
    assert assignments.get_by_task(t4.id) is None


@pytest.mark.parametrize(
    ("today", "start"),
    [
        pytest.param(MON_19, TUE_20, id="hoy-habil-inicia-manana"),
        pytest.param(FRI_23, MON_26, id="manana-es-sabado"),
        pytest.param(SAT_24, MON_26, id="hoy-es-sabado"),
    ],
)
def test_esc28_la_fecha_de_inicio_es_el_siguiente_dia_habil(
    assignment_service: AssignmentService, clock: FixedClock, make_task, make_worker, today, start
):
    clock.day = today
    make_worker("Ana", skills=["python"])
    make_task("API", 4, ["python"])

    report = assignment_service.auto_assign()

    [assigned] = report.assigned
    assert assigned.start_date == start
