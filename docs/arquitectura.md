# Arquitectura

## 1. Decisiones de diseño

| Herramienta | Por qué |
|-------------|---------|
| **FastAPI** | API tipada con Pydantic; genera OpenAPI y Swagger automáticamente. |
| **PostgreSQL** | El dominio es relacional (tareas ↔ trabajadores ↔ skills ↔ asignaciones). |
| **SQLAlchemy** | ORM estándar de Python; modelos declarativos y tipados. |
| **Docker Compose** | Base de datos local con un solo comando, sin instalar Postgres. |
| **uv** | Dependencias y entorno de Python rápidos y reproducibles (`uv.lock`). |
| **Astro + React + Tailwind** | Frontend ligero; React para los componentes interactivos (islands); Tailwind para estilos. |
| **`openapi-typescript`** | Tipos generados desde el OpenAPI: front y back sincronizados. |
| **`openapi-fetch` + `openapi-react-query`** | Cliente tipado con **TanStack Query** (caché, carga/error, reintentos). |
| **Make** | Punto de entrada único para todos los comandos. |
| **Versionado `/api/v1`** | Evolucionar la API sin romper clientes. |

> Pendiente: migraciones (Alembic), CI/CD (GitHub Actions) y deploy (Terraform + AWS).

## 2. Estructura

```
.
├── backend/             # API FastAPI
│   ├── app/
│   │   ├── main.py      # app + routers versionados
│   │   ├── db.py        # conexión SQLAlchemy y modelos
│   │   ├── seed.py      # datos de demo
│   │   ├── api/v1/      # endpoints v1
│   │   └── services/    # lógica de negocio
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
