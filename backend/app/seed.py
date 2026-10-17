from sqlalchemy import func, select

from app.db import SessionLocal, Task, Worker

WORKERS = [
    Worker(name="Ana", availability=6, skills=["python", "sql"]),
    Worker(name="Luis", availability=8, skills=["python", "react"]),
    Worker(name="Marta", availability=4, skills=["react", "css"]),
    Worker(name="Pedro", availability=8, skills=[]),
]

# Sin asignaciones: la demo arranca con todo pendiente para mostrar asignación manual y auto-asignación
TASKS = [
    Task(name="API de reportes", effort=10, skills=["python", "sql"]),
    Task(name="Endpoint de login", effort=5, skills=["python"]),
    Task(name="Dashboard", effort=12, skills=["react", "css"]),
    Task(name="Formulario de registro", effort=6, skills=["react"]),
    Task(name="Limpieza de datos", effort=3, skills=[]),
    Task(name="Documentación", effort=4, skills=[], status="done"),
    Task(name="Migrar a Rust", effort=20, skills=["rust"]),  # nadie la puede tomar (RN21)
]


def seed() -> None:
    with SessionLocal() as session:
        if session.scalar(select(func.count()).select_from(Worker)):
            print("Ya hay datos, no se hace seed.")
            return
        session.add_all(WORKERS + TASKS)
        session.commit()
        print(f"Seed completado: {len(WORKERS)} trabajadores, {len(TASKS)} tareas.")


if __name__ == "__main__":
    seed()
