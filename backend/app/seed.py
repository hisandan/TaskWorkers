from sqlalchemy import func, select

from app.adapters.sql.db import SessionLocal, SkillRow, TaskRow, WorkerRow

# Script de infraestructura: escribe las filas directo, sin pasar por los casos de uso

SKILLS = {name: SkillRow(name=name) for name in ["python", "sql", "react", "css", "rust"]}


def skills(*names: str) -> list[SkillRow]:
    return [SKILLS[name] for name in names]


WORKERS = [
    WorkerRow(name="Ana", availability=6, skills=skills("python", "sql")),
    WorkerRow(name="Luis", availability=8, skills=skills("python", "react")),
    WorkerRow(name="Marta", availability=4, skills=skills("react", "css")),
    WorkerRow(name="Pedro", availability=8, skills=[]),
]

# Sin asignaciones: la demo arranca con todo pendiente para mostrar asignación manual y auto-asignación
TASKS = [
    TaskRow(name="API de reportes", effort=10, skills=skills("python", "sql")),
    TaskRow(name="Endpoint de login", effort=5, skills=skills("python")),
    TaskRow(name="Dashboard", effort=12, skills=skills("react", "css")),
    TaskRow(name="Formulario de registro", effort=6, skills=skills("react")),
    TaskRow(name="Limpieza de datos", effort=3, skills=[]),
    TaskRow(name="Documentación", effort=4, skills=[], status="done"),
    TaskRow(name="Migrar a Rust", effort=20, skills=skills("rust")),  # nadie la puede tomar (RN21)
]


def seed() -> None:
    with SessionLocal() as session:
        if session.scalar(select(func.count()).select_from(WorkerRow)):
            print("Ya hay datos, no se hace seed.")
            return
        session.add_all(WORKERS + TASKS)
        session.commit()
        print(f"Seed completado: {len(WORKERS)} trabajadores, {len(TASKS)} tareas.")


if __name__ == "__main__":
    seed()
