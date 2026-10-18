[← Volver a README](../README.md)

# Archivos Core

**Objetivo:** ubicar rápido los archivos principales de la solución y qué encontrar en cada uno.

## Índice

1. [Backend](#1-backend)
2. [Frontend](#2-frontend)
3. [Scripts e infraestructura](#3-scripts-e-infraestructura)

---

## 1. Backend

| Archivo | Qué encontrar |
|---------|---------------|
| [`app/domain/rules.py`](../backend/app/domain/rules.py) | **El núcleo del problema.** `can_take` (skills), `schedule` (fechas, devuelve un `Schedule`), `Slot`, `agenda` y `late_starts` (agenda del trabajador) y `auto_assign` con su estrategia (`task_priority`, `worker_priority`). Funciones puras. |
| [`app/domain/models.py`](../backend/app/domain/models.py) | Entidades del dominio: `Task`, `Worker` y `Assignment`. |
| [`app/domain/errors.py`](../backend/app/domain/errors.py) | Errores de negocio (`MissingSkills`, `TaskDone`, `StartInPast`, ...). |
| [`app/application/ports.py`](../backend/app/application/ports.py) | Puertos: los repositorios y el `Clock`. |
| [`app/application/assignments.py`](../backend/app/application/assignments.py) | Casos de uso de asignación manual, auto-asignación y eliminación de asignaciones (Req3, Req3a, Req4, RN30). |
| [`app/application/tasks.py`](../backend/app/application/tasks.py) · [`workers.py`](../backend/app/application/workers.py) | Casos de uso del CRUD (Req1, Req2) y reglas de edición y borrado (RN22 a RN25). |
| [`app/adapters/http/`](../backend/app/adapters/http/) | Routers y schemas por recurso. `dependencies.py` arma los casos de uso y `errors.py` traduce los errores a HTTP. |
| [`app/adapters/sql/db.py`](../backend/app/adapters/sql/db.py) | Conexión, sesión por request y filas: `SkillRow`, `TaskRow`, `WorkerRow`, `AssignmentRow`. |
| [`app/adapters/sql/repositories.py`](../backend/app/adapters/sql/repositories.py) | Implementación de los puertos sobre Postgres. |
| [`app/seed.py`](../backend/app/seed.py) | Datos de demo. |
| [`migrations/versions/`](../backend/migrations/versions/) | Esquema de la base (Alembic). |

## 2. Frontend

## 3. Scripts e infraestructura
