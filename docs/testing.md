[← Volver a README](../README.md)

# Enfoque en Testing

**Objetivo:** justificar qué se prueba en cada capa, dónde vive cada test y cómo correrlos.

## Índice

1. [Qué se prueba en cada capa](#1-qué-se-prueba-en-cada-capa)
2. [Escenarios (BDD)](#2-escenarios-bdd)
3. [Dónde vive cada test](#3-dónde-vive-cada-test)
4. [Cómo correrlos](#4-cómo-correrlos)

---

## 1. Qué se prueba en cada capa

| Capa | Qué prueba | Qué no prueba | Herramienta |
|------|------------|---------------|-------------|
| **Unit** | La lógica de negocio pura: subconjunto de skills, cálculo de fechas y elección de candidato en la auto-asignación. | HTTP ni base de datos. | pytest |
| **Integration** | La API de punta a punta contra Postgres real: CRUD, validaciones, códigos de respuesta y que las reglas se respeten al persistir. | La interfaz web. | pytest + `TestClient` |
| **E2E** | Los flujos de la demo desde el navegador. | Casos borde (ya cubiertos abajo). | Playwright |

**Por qué esta división:**

- El núcleo del problema (fechas, skills, auto-asignación) son **funciones puras**: se prueban rápido y con muchos casos borde sin levantar nada.
- Integration usa **Postgres real** (base `taskworkers_test`), no SQLite, para probar el mismo motor que la app. Cada test corre en una transacción que se revierte al final, así los tests no se contaminan entre sí.
- E2E son **pocos** y solo de los flujos que se muestran en la demo, porque son lentos y frágiles.
- E2E **no es el enfoque de esta prueba**: su implementación se deja a Claude Code a partir de los escenarios definidos en [Escenarios de prueba (BDD)](testing/bdd.md).

**Decisiones para que los tests sean deterministas:**

- **"Hoy" se inyecta** (no se lee el reloj dentro de la lógica). Así RN11 y RN20 se prueban con una fecha fija.
- **Convención de códigos de error:**
  - `422`: el payload es inválido por sí solo (esfuerzo 0, disponibilidad 25, fecha pasada).
  - `409`: la operación choca con el estado actual de los datos (skills no compatibles, tarea `done`, tarea ya asignada, borrar con asignaciones).

## 2. Escenarios (BDD)

Los escenarios a probar están definidos en [Escenarios de prueba (BDD)](testing/bdd.md), en formato Dado / Cuando / Entonces y agrupados igual que las [Reglas de Negocio](alcance/negocio.md).

- Cada escenario tiene un ID (`ESC-07`), la regla que cubre (`RN6`) y la capa donde se prueba.
- El test lleva el ID en el nombre: `test_esc07_rechaza_si_faltan_skills` (pytest) o `test("ESC-34 ...")` (Playwright). Así se traza **RN → escenario → test**.
- Los escenarios son especificación, no se ejecutan directamente (no se usa `pytest-bdd`): se implementan como tests normales.
- Flujo de trabajo: primero se escriben todos los tests a partir de los escenarios (en rojo) y la implementación los va pasando a verde.

## 3. Dónde vive cada test

Los tests se organizan **por capa y luego por funcionalidad**, no replicando las carpetas de `app/`.

```
backend/tests/
├── unit/                        # sin DB ni HTTP
│   ├── test_skills.py           # ESC-08
│   ├── test_schedule.py         # ESC-09 a ESC-15
│   └── test_auto_assign.py      # ESC-23 a ESC-26
└── integration/                 # API + Postgres (taskworkers_test)
    ├── conftest.py              # client, session con rollback, "hoy" fijo
    ├── test_tasks_api.py        # ESC-01 a ESC-04
    ├── test_workers_api.py      # ESC-05 a ESC-07
    ├── test_assignments_api.py  # ESC-16 a ESC-22
    ├── test_auto_assign_api.py  # ESC-27 a ESC-29
    └── test_edit_delete_api.py  # ESC-30 a ESC-32
e2e/tests/
├── smoke.spec.ts                # ESC-33
└── demo.spec.ts                 # ESC-34 a ESC-36
```

## 4. Cómo correrlos

| Comando | Qué corre | Requisito |
|---------|-----------|-----------|
| `make test` | unit + integration | `make db` |
| `make test-unit` | solo unit | — |
| `make test-integration` | solo integration (crea `taskworkers_test` si no existe) | `make db` |
| `make test-e2e` | E2E en navegador headless; `HEADED=1` lo abre visible | app corriendo (`db`, `seed`, `backend`, `frontend`) |

Para correr un solo escenario:

```bash
cd backend && uv run pytest -k esc17      # pytest
cd e2e && pnpm test -g "ESC-34"           # Playwright
```
