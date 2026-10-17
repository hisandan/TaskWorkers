import pytest

from app.domain import can_take


@pytest.mark.parametrize(
    ("task_skills", "worker_skills", "expected"),
    [
        pytest.param({"python"}, {"python", "sql"}, True, id="subconjunto"),
        pytest.param({"python", "sql"}, {"python", "sql"}, True, id="iguales"),
        pytest.param({"python", "sql"}, {"python"}, False, id="falta-sql"),
        pytest.param({"python"}, set(), False, id="trabajador-sin-skills"),
        pytest.param(set(), {"python"}, True, id="tarea-sin-skills"),
        pytest.param(set(), set(), True, id="ambos-sin-skills"),
    ],
)
def test_esc08_puede_tomar_la_tarea_si_tiene_todas_sus_skills(task_skills, worker_skills, expected):
    assert can_take(task_skills, worker_skills) is expected
