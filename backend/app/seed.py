from sqlalchemy import func, select

from app.adapters.sql.db import SessionLocal, TaskRow, WorkerRow

# Script de infraestructura: escribe las filas directo, sin pasar por los casos de uso

WORKERS = [
    WorkerRow(name="Ana", availability=6, skills=["python", "sql"]),
    WorkerRow(name="Luis", availability=8, skills=["python", "react"]),
    WorkerRow(name="Marta", availability=4, skills=["react", "css"]),
    WorkerRow(name="Pedro", availability=8, skills=[]),
]

# Sin asignaciones: la demo arranca con todo pendiente para mostrar asignación manual y auto-asignación
TASKS = [
    TaskRow(name="API de reportes", effort=10, skills=["python", "sql"]),
    TaskRow(name="Endpoint de login", effort=5, skills=["python"]),
    TaskRow(name="Dashboard", effort=12, skills=["react", "css"]),
    TaskRow(name="Formulario de registro", effort=6, skills=["react"]),
    TaskRow(name="Limpieza de datos", effort=3, skills=[]),
    TaskRow(name="Documentación", effort=4, skills=[], status="done"),
    TaskRow(name="Migrar a Rust", effort=20, skills=["rust"]),  # nadie la puede tomar (RN21)
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
