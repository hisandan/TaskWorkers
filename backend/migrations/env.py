from alembic import context

from app.db import Base, engine

# Los modelos de app.db son la fuente de verdad para --autogenerate
target_metadata = Base.metadata


def run_migrations() -> None:
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


run_migrations()
