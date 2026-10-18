from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.adapters.sql.db import (
    AssignmentRow,
    SessionLocal,
    SkillRow,
    TaskRow,
    WorkerRow,
    task_skills,
    worker_skills,
)

# Script de infraestructura: escribe las filas directo, sin pasar por los casos de uso.
# También lo usan los endpoints de desarrollo (app/adapters/http/dev.py: Reset y Populate)

SKILLS = ["python", "sql", "react", "css", "rust"]

# (nombre, disponibilidad, skills)
WORKERS = [
    {"name": "Ana", "availability": 6, "skills": ["python", "sql"]},
    {"name": "Luis", "availability": 8, "skills": ["python", "react"]},
    {"name": "Marta", "availability": 4, "skills": ["react", "css"]},
    {"name": "Pedro", "availability": 8, "skills": []},
]

# Sin asignaciones: la demo arranca con todo pendiente para mostrar asignación manual y auto-asignación
TASKS = [
    {"name": "API de reportes", "effort": 10, "skills": ["python", "sql"]},
    {"name": "Endpoint de login", "effort": 5, "skills": ["python"]},
    {"name": "Dashboard", "effort": 12, "skills": ["react", "css"]},
    {"name": "Formulario de registro", "effort": 6, "skills": ["react"]},
    {"name": "Limpieza de datos", "effort": 3, "skills": []},
    {"name": "Documentación", "effort": 4, "skills": [], "status": "done"},
    {"name": "Migrar a Rust", "effort": 20, "skills": ["rust"]},  # nadie la puede tomar (RN21)
]


def reset(session: Session) -> None:
    """Borra todos los datos (hijos primero, por las claves foráneas)."""
    for table in (AssignmentRow.__table__, task_skills, worker_skills, TaskRow.__table__, WorkerRow.__table__):
        session.execute(delete(table))
    session.execute(delete(SkillRow))
    session.expunge_all()  # las filas ya cargadas en la sesión dejaron de existir


def populate(session: Session) -> None:
    """Borra todo y carga los datos de demo. Filas nuevas en cada llamada."""
    reset(session)
    skills = {name: SkillRow(name=name) for name in SKILLS}
    session.add_all(
        [WorkerRow(name=w["name"], availability=w["availability"], skills=[skills[s] for s in w["skills"]]) for w in WORKERS]
        + [
            TaskRow(name=t["name"], effort=t["effort"], skills=[skills[s] for s in t["skills"]], status=t.get("status", "not-done"))
            for t in TASKS
        ]
    )
    session.flush()


def seed() -> None:
    with SessionLocal() as session:
        if session.scalar(select(func.count()).select_from(WorkerRow)):
            print("Ya hay datos, no se hace seed.")
            return
        populate(session)
        session.commit()
        print(f"Seed completado: {len(WORKERS)} trabajadores, {len(TASKS)} tareas.")


if __name__ == "__main__":
    seed()
