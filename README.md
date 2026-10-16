# TaskWorkers

---

## 1. Enunciado

Implement an application that covers the following requirements.

### 1.1 Requirements

| ID | Requirement |
|----|-------------|
| **Req1** | Application should CRUD **tasks**: `Task-name`, `effort (hours)`, `skills`, `status (done, not-done)` |
| **Req2** | Application should CRUD **workers**: `worker-name`, `Availability (hours/day)`, `skills` |
| **Req3** | Application should allow **manual assignment** of tasks to workers (`worker`, `tasks`, `datestart`) |
| **Req3a** | Assignment is only allowed if **task-skills are a subset of worker-skills**. |
| **Req4** | **Auto-Assignment**: implement an auto-assignment feature. |

### 1.2 Deliverables

Upload the code to a git repo of your choice and share the link.

It should contain scripts that:

- Build / run / test the application.
- Populate the app with data to show, test and present the app.

---

## 2. Inicio rápido

### 2.1 Requisitos previos

- [Docker](https://www.docker.com/) (con Docker Compose)
- [uv](https://docs.astral.sh/uv/) (Python ≥ 3.13)
- [Node.js](https://nodejs.org/) ≥ 22.22 (requerido por Astro) y [pnpm](https://pnpm.io/)
- `make`

### 2.2 Pasos

```bash
# 1. Base de datos (Postgres en Docker)
make db

# 2. Crear las tablas
cd backend && uv run python -m app.db && cd ..

# 3. Backend (FastAPI) → Swagger en http://localhost:8000/docs
make backend

# 4. Frontend (en otra terminal) → http://localhost:4321
cd frontend && pnpm install && pnpm dev
```

> TODO: script para poblar la app con datos de demo (`make seed`).

### 2.3 Comandos `make`

| Comando | Acción |
|---------|--------|
| `make db` | Levanta Postgres con Docker Compose |
| `make backend` | Corre FastAPI en modo dev |
| `make api-client` | Genera el cliente TypeScript tipado en `frontend/src/client` a partir del OpenAPI del backend |

> TODO: `make test`, `make seed`, `make build`.

---

## 3. Decisiones de diseño

| Herramienta | Por qué |
|-------------|---------|
| **FastAPI** | API tipada con Pydantic; genera OpenAPI y Swagger automáticamente. |
| **PostgreSQL** | El dominio es relacional (tasks ↔ workers ↔ skills ↔ asignaciones). |
| **SQLAlchemy** | ORM estándar de Python; modelos declarativos y tipados. |
| **Docker Compose** | Base de datos local con un solo comando, sin instalar Postgres. |
| **uv** | Gestión de dependencias y entorno de Python rápida y reproducible (`uv.lock`). |
| **Astro + React + Tailwind** | Frontend ligero con Astro; React para los componentes interactivos (islands) del CRUD; Tailwind para estilos sin CSS a medida. |
| **`@hey-api/openapi-ts`** | Cliente TS generado desde el OpenAPI: front y back sincronizados por tipos. |
| **Make** | Punto de entrada único para todos los comandos del proyecto. |
| **Versionado `/api/v1`** | Permite evolucionar la API sin romper clientes existentes. |

> TODO: migraciones (Alembic), CI/CD (GitHub Actions) y deploy (Terraform + AWS).

---

## 4. Estructura del proyecto

```
.
├── backend/             # API FastAPI
│   ├── app/
│   │   ├── main.py      # app + montaje de routers versionados
│   │   ├── db.py        # conexión SQLAlchemy y modelos
│   │   ├── api/v1/      # endpoints de la v1
│   │   └── services/    # lógica de negocio
│   └── tests/
├── frontend/            # Astro + React
├── docker-compose.yml   # Postgres
└── Makefile
```

---

## 5. Reglas de negocio

> TODO: definir y documentar.
> - Req3a: las skills de la tarea deben ser subconjunto de las del worker.
> - Semántica de `datestart` y cómo se consume la disponibilidad (horas/día).
> - Algoritmo de auto-asignación (Req4).

---

## 6. Tests

```bash
cd backend && uv run pytest
```

> TODO: qué cubren los tests y `make test`.
