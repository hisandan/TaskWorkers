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

## Estructura

```
.
├── backend/             # API FastAPI
│   ├── app/
│   │   ├── main.py      # app + routers versionados
│   │   ├── db.py        # conexión SQLAlchemy y modelos
│   │   ├── seed.py      # datos de demo
│   │   ├── api/v1/      # endpoints v1
│   │   └── services/    # lógica de negocio
│   ├── migrations/      # migraciones Alembic
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
