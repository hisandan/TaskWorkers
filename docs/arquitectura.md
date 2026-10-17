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

**Decisiones de diseño:**

- **Toda la lógica de negocio en `domain.py`**, como funciones puras (sin HTTP ni DB). Los endpoints solo validan contra la base, llaman al dominio y persisten. Así el núcleo del problema se lee en un solo archivo y se prueba con tests unitarios.
- **Un archivo por recurso en `api/`** con sus schemas y endpoints juntos: menos saltos entre archivos.
- **Skills como `ARRAY(String)` de Postgres**, sin tabla aparte: una skill es solo una etiqueta (RN3).
- **`Assignment.last_day_hours`** guarda cuántas horas se usaron el día de fin, para que la siguiente tarea del trabajador use las que sobran (RN15) sin recalcular toda su agenda.

## Estructura

```
.
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── main.py          # app + routers bajo /api/v1
│   │   ├── db.py            # conexión SQLAlchemy y modelos (Task, Worker, Assignment)
│   │   ├── domain.py        # lógica de negocio pura: skills, fechas, auto-asignación
│   │   ├── seed.py          # datos de demo
│   │   └── api/             # un archivo por recurso: schemas Pydantic + endpoints
│   │       ├── tasks.py         # Req1
│   │       ├── workers.py       # Req2
│   │       └── assignments.py   # Req3, Req3a, Req4
│   ├── migrations/          # migraciones Alembic
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
