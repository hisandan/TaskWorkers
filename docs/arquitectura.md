[← Volver a README](../README.md)

# Arquitectura y Stack Elegidos

| Capa | Herramienta | Uso |
|------|-------------|---------|
| Backend | **FastAPI** (Python 3.13) | API tipada con Pydantic; genera OpenAPI y Swagger sin trabajo extra (util para testear CRUD). |
| Persistencia | **PostgreSQL** + **SQLAlchemy 2** + **Alembic** | El dominio es relacional (tareas ↔ trabajadores ↔ skills ↔ asignaciones); Alembic versiona los cambios del esquema. |
| Frontend | **Astro** + **React** | Páginas ligeras; React solo donde hay interacción (islands). |
| Contrato API | **`openapi-typescript`** + **`openapi-fetch`** + **TanStack Query** | El front usa tipos generados del OpenAPI del back: si la API cambia, el front no compila. |
| Testing | **pytest** + **Playwright** | Unit/integración en el back y E2E en el navegador. |
| Entorno | **uv**, **pnpm**, **Docker Compose** | Dependencias reproducibles y Postgres con un solo comando. |
| Comandos | **Make** | Un solo punto de entrada para construir, correr y probar. |

> **Nota:** el frontend no es el enfoque de esta prueba, por lo que su implementación se deja a Claude Code.

## Arquitectura hexagonal (puertos y adaptadores)

![Arquitectura hexagonal](diagramas/img/02-arquitectura-hexagonal.png)

**Regla de dependencias:** `adapters → application → domain`. El dominio no importa nada de FastAPI ni de SQLAlchemy, y la aplicación solo conoce los puertos, no sus implementaciones.

**Decisiones de diseño:**

- **El dominio no depende de nada.** `domain/` son dataclasses (`Task`, `Worker`, `Assignment`, `Schedule`) y funciones puras. El núcleo del problema (skills, fechas y auto-asignación) se lee en un solo archivo, `domain/rules.py`, y se prueba con tests unitarios.
- **Los casos de uso orquestan.** `application/` lee por los puertos, valida contra el estado actual (tarea `done`, ya asignada, fecha pasada), llama a `rules.py` y guarda. Los puertos (`ports.py`) son `Protocol`: los repositorios y el `Clock`.
- **Adaptadores en `adapters/`.**
  - De entrada: `http/`, con un archivo por recurso que junta schemas Pydantic y routers sin lógica.
  - De salida: `sql/` (SQLAlchemy) y `clock.py`.
  - `http/dependencies.py` es el punto de composición: arma cada caso de uso con sus adaptadores.
- **Errores de dominio, no HTTP.** Los casos de uso lanzan `MissingSkills`, `TaskDone`, `StartInPast`, etc., agrupados en `NotFound`, `Conflict` e `InvalidInput`. `http/errors.py` traduce cada grupo a `404`, `409` y `422`.
- **Dos representaciones de cada entidad**: `Task` (dominio) y `TaskRow` (SQLAlchemy), mapeadas por los repositorios. Es el costo principal de la arquitectura. A cambio, los casos de uso se prueban con repositorios en memoria, sin Postgres.
- **Una transacción por request.** `get_session` hace commit al terminar o rollback si hubo error, y los repositorios solo hacen `flush`. Así la auto-asignación guarda todo o nada.
- **"Hoy" es un puerto (`Clock`)**, para que los tests fijen la fecha (RN11, RN20).
- **Skills en una tabla propia** (`skills`, con `task_skills` y `worker_skills`), para cruzar tareas y trabajadores por skill. En el dominio siguen siendo una lista de nombres (RN3); los repositorios hacen la traducción.
- **De una asignación solo se guarda la fecha de inicio** (RN26). Las fechas de fin se calculan con `rules.agenda`, recorriendo la agenda del trabajador, y la API las expone en un read model (`ScheduledAssignment`). Así hay una sola fuente de verdad y editar una tarea o un trabajador no deja fechas desincronizadas; a cambio, esas ediciones revalidan la agenda (RN22, RN25).

## Estructura

```
.
├── backend/                     # API FastAPI
│   ├── app/
│   │   ├── main.py              # app + routers bajo /api/v1 + manejo de errores de dominio
│   │   ├── domain/              # núcleo: sin FastAPI ni SQLAlchemy
│   │   │   ├── models.py            # entidades: Task, Worker, Assignment, Schedule
│   │   │   ├── rules.py             # reglas puras: skills, fechas, agenda, auto-asignación
│   │   │   └── errors.py            # errores de negocio (MissingSkills, TaskDone, ...)
│   │   ├── application/         # casos de uso
│   │   │   ├── ports.py             # puertos: TaskRepository, WorkerRepository, AssignmentRepository, Clock
│   │   │   ├── tasks.py             # Req1
│   │   │   ├── workers.py           # Req2
│   │   │   └── assignments.py       # Req3, Req3a, Req4
│   │   ├── adapters/
│   │   │   ├── http/                # entrada: un archivo por recurso (schemas Pydantic + routers)
│   │   │   │   ├── tasks.py, workers.py, assignments.py
│   │   │   │   ├── dependencies.py      # composición: arma cada caso de uso con sus adaptadores
│   │   │   │   └── errors.py            # error de dominio -> 404 / 409 / 422
│   │   │   ├── sql/                 # salida: Postgres
│   │   │   │   ├── db.py                # conexión, sesión por request y filas (SkillRow, TaskRow, WorkerRow, AssignmentRow)
│   │   │   │   └── repositories.py      # implementan los puertos y mapean fila <-> entidad
│   │   │   └── clock.py             # salida: implementa Clock con la fecha del sistema
│   │   └── seed.py              # datos de demo
│   ├── migrations/              # migraciones Alembic
│   └── tests/
├── frontend/            # Astro + React
│   └── src/
│       ├── api/         # api.generated.ts (generado) + client.ts
│       ├── components/  # componentes React (islands)
│       └── pages/       # páginas Astro
├── docs/                # documentación
├── docker-compose.yml   # Postgres
└── Makefile
```
