# backend

A project created with FastAPI CLI.

## Quick Start

### Start the development server

```bash
uv run fastapi dev
```

Visit http://localhost:8000

### Deploy to FastAPI Cloud

Sign up and log in at https://fastapicloud.com, then deploy with:

```bash
uv run fastapi deploy
```

## Migraciones (Alembic)

Los modelos de `app/adapters/sql/db.py` son la fuente de verdad: `--autogenerate` compara `Base.metadata` contra la DB de `DATABASE_URL` y escribe la diferencia en `migrations/versions/`. Por eso la DB debe estar levantada y en `head` antes de generar.

```bash
make db && make migrate   # desde la raíz: Postgres arriba y al día

# 1. Cambia el modelo en app/adapters/sql/db.py (p. ej. agregar `email: Mapped[str | None]` a WorkerRow)
# 2. Genera la migración (--rev-id mantiene la numeración 0001, 0002, ...)
uv run alembic revision --autogenerate -m "add email to workers" --rev-id 0002
# 3. Revisa migrations/versions/0002_add_email_to_workers.py y aplícala
uv run alembic upgrade head
```

Revisa siempre el archivo generado: autogenerate no detecta renombres (los ve como drop + add), cambios en CHECK constraints ni migraciones de datos.

Otros: `uv run alembic current` (revisión actual), `uv run alembic history`, `uv run alembic downgrade -1`, `uv run alembic upgrade head --sql` (ver el SQL sin ejecutarlo).

## Project Structure

- `app/main.py` - App factory; mounts versioned routers under `/api/v1`
- `app/api/v1/` - v1 routers and endpoints
- `app/services/` - Business services
- `tests/` - Test suite (`uv run pytest`)
- `pyproject.toml` - Project dependencies

## Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [FastAPI Cloud](https://fastapicloud.com)
