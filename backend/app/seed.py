from sqlalchemy import func, select

from app.db import SessionLocal, Task, init_db


def seed() -> None:
    init_db()
    with SessionLocal() as session:
        if session.scalar(select(func.count()).select_from(Task)):
            print("La tabla tasks ya tiene datos, no se hace seed.")
            return
        session.add_all([Task(name=f"Task {i}") for i in range(1, 26)])
        session.commit()
        print("Seed completado: 25 tasks.")


if __name__ == "__main__":
    seed()
