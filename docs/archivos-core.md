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
| [`app/domain.py`](../backend/app/domain.py) | **El núcleo del problema.** `can_take` (skills), `schedule` (fechas) y `auto_assign`. Funciones puras. |
| [`app/db.py`](../backend/app/db.py) | Conexión y modelos: `Task`, `Worker`, `Assignment`. |
| [`app/api/tasks.py`](../backend/app/api/tasks.py) | CRUD de tareas (Req1). |
| [`app/api/workers.py`](../backend/app/api/workers.py) | CRUD de trabajadores (Req2). |
| [`app/api/assignments.py`](../backend/app/api/assignments.py) | Asignación manual y auto-asignación (Req3, Req3a, Req4). |
| [`app/seed.py`](../backend/app/seed.py) | Datos de demo. |
| [`migrations/versions/`](../backend/migrations/versions/) | Esquema de la base (Alembic). |

## 2. Frontend

## 3. Scripts e infraestructura
