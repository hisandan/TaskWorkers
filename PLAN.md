# Plan — TaskWorkers

Plan de alto nivel: herramientas y buenas prácticas a seguir. El detalle se define en cada fase.

---

## 1. Stack

| Capa | Herramienta |
|------|-------------|
| Backend | **FastAPI** + **Pydantic v2** + `pydantic-settings` |
| Persistencia | **PostgreSQL** + **SQLAlchemy 2.0** (sync) + **Alembic** (migraciones) |
| Frontend | **Astro** + **React islands** + **Tailwind CSS** |
| Contrato API | OpenAPI de FastAPI → cliente TS generado con **`@hey-api/openapi-ts`** (ver §3) |
| Contenedores | **Docker** + **docker compose** (db, api, web) |
| CI/CD | **GitHub Actions** |
| Infraestructura | **Terraform** sobre **AWS** |

## 2. Arquitectura

- **Clean Architecture (puertos y adaptadores)** en `backend/`:
  - `domain/` — entidades (`Task`, `Worker`, `Assignment`), reglas (Req3a: `task.skills ⊆ worker.skills`) y algoritmo de **auto-asignación** como funciones puras, sin dependencias externas.
  - `application/` — casos de uso + puertos (interfaces de repositorio).
  - `infrastructure/` — adaptador SQLAlchemy/Postgres.
  - `api/` — routers FastAPI, DTOs, inyección de dependencias.
- Los puertos permiten repositorios **in-memory** para tests unitarios rápidos.
- **ADRs** cortos (`docs/adr/`) para decisiones clave: semántica de `datestart`/capacidad diaria, algoritmo de auto-asignación, elección de deploy.

## 3. Sincronización backend ↔ frontend (OpenAPI)

- El backend es la **fuente de verdad**: FastAPI genera `openapi.json` a partir de los modelos Pydantic.
- El frontend consume un **cliente TypeScript generado** desde ese spec con **`@hey-api/openapi-ts`** (tipos + SDK con `fetch`; plugin opcional para TanStack Query).
  - Alternativas: `openapi-typescript` + `openapi-fetch` (solo tipos, más ligero) u `orval`.
- Script `make api-client`: exporta el spec y regenera el cliente; el código generado no se edita a mano.
- CI verifica que el cliente esté sincronizado (regenerar y fallar si hay diff), así un cambio en la API que rompa el front se detecta en el PR.

## 4. Auto-asignación (idea inicial)

- Greedy determinista: ordenar tareas pendientes por menor nº de workers elegibles y mayor esfuerzo; asignar al worker elegible que la termine antes según su disponibilidad (h/día) y carga existente.
- Invariantes: nunca violar Req3a, nunca exceder capacidad diaria.

## 5. Testing

- Pirámide de tests con **pytest**:
  - **Unit** — dominio y casos de uso (repos in-memory).
  - **Property-based** — **Hypothesis** para Req3a y los invariantes de auto-asignación.
  - **Integración** — repositorios contra Postgres real con **Testcontainers**.
  - **API** — `TestClient`/`httpx` sobre la app completa.
  - **E2E front** — **Playwright** (flujos críticos).
- Cobertura con `pytest-cov` y umbral mínimo en CI.

## 6. Calidad de código

- **uv** (dependencias y entorno), **ruff** (lint + format), **mypy** estricto.
- Front: **ESLint**, **Prettier**, `tsc --noEmit`.
- **pre-commit** con los hooks anteriores.
- **Conventional Commits**, `main` protegida, trabajo vía PRs.

## 7. Scripts (requisito del enunciado)

`Makefile` como punto de entrada único:

| Comando | Acción |
|---------|--------|
| `make build` | Construye imágenes Docker |
| `make run` | Levanta el stack con docker compose |
| `make test` | Lint + types + todos los tests |
| `make api-client` | Regenera el cliente TS desde OpenAPI |
| `make seed` | Puebla datos de demo vía API |
| `make demo` | `run` + `seed` + escenario de auto-asignación |

## 8. CI/CD (GitHub Actions)

- **CI** (en PR): lint → type-check → tests (Postgres como service) → check de cliente OpenAPI sincronizado → build de imágenes.
- **CD** (en `main`): `terraform plan/apply` + push de imagen + deploy del front.
- Autenticación a AWS por **OIDC** (sin access keys).

## 9. Deploy en AWS (sencillo)

- **API**: contenedor en **App Runner** (imagen en **ECR**).
- **DB**: **RDS PostgreSQL** (`db.t4g.micro`), acceso vía VPC connector.
- **Front**: build estático de Astro en **S3 + CloudFront**.
- Secretos en **SSM Parameter Store / Secrets Manager**.
- Estado de Terraform en S3 (con lock).

## 10. Fases

1. Scaffolding: estructura, tooling, docker compose, CI básica.
2. Dominio + casos de uso + tests (Req1–Req3a).
3. Persistencia Postgres + migraciones + tests de integración.
4. API FastAPI + tests de API.
5. Auto-asignación (Req4) + property-based tests + ADR.
6. Frontend Astro/React + E2E.
7. Seed/demo scripts.
8. Terraform + CD a AWS.
