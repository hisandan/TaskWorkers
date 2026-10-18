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

Las capas siguen la [arquitectura hexagonal](arquitectura.md): cada una prueba un anillo del hexágono.

| Capa | Qué prueba | Qué no prueba | Herramienta |
|------|------------|---------------|-------------|
| **Unit** | Las reglas puras de `domain/rules.py`: subconjunto de skills, cálculo de fechas, agenda del trabajador y elección de candidato en la auto-asignación. | Casos de uso, HTTP ni base de datos. | pytest |
| **Application** | Los casos de uso de `application/` contra repositorios en memoria y un reloj fijo, es decir, las reglas que dependen del estado: tarea `done`, ya asignada, fecha pasada, agenda ocupada, qué toma la auto-asignación y editar o borrar con asignaciones. | HTTP ni Postgres. | pytest + dobles (`tests/fakes.py`) |
| **Integration** | Los adaptadores contra Postgres real: CRUD y validación del payload, que cada error de dominio llegue con su código HTTP y los flujos de asignación de punta a punta. | Reglas ya cubiertas en application. | pytest + `TestClient` |
| **E2E** | Los flujos de la demo desde el navegador. | Casos borde (ya cubiertos abajo). | Playwright |

**Por qué esta división:**

- El núcleo del problema (fechas, skills, auto-asignación) son **funciones puras**: se prueban rápido y con muchos casos borde sin levantar nada.
- Las reglas que dependen del estado se prueban **contra los puertos con dobles en memoria**: tardan milisegundos y no necesitan Docker. Cada test prepara solo el estado que le importa.
- Integration queda para lo que los dobles no pueden garantizar: que los **adaptadores reales** cumplan el contrato (mapeo fila ↔ entidad, transacciones, códigos HTTP).
- Integration usa **Postgres real** (base `taskworkers_test`), no SQLite, para probar el mismo motor que la app. Cada test corre en una transacción que se revierte al final, así los tests no se contaminan entre sí.
- E2E son **pocos** y solo de los flujos que se muestran en la demo, porque son lentos y frágiles.
- E2E **no es el enfoque de esta prueba**: su implementación se deja a Claude Code a partir de los escenarios definidos en [Escenarios de prueba (BDD)](testing/bdd.md).

**Decisiones para que los tests sean deterministas:**

- **"Hoy" es un puerto (`Clock`)**: la lógica no lee el reloj. En application se usa `FixedClock`, y en integration se sobreescribe `get_clock`. Así RN11 y RN20 se prueban con una fecha fija.
- **Convención de códigos de error:** los casos de uso lanzan errores de dominio y [`adapters/http/errors.py`](../backend/app/adapters/http/errors.py) los traduce por grupo (ESC-37):
  - `404` (`NotFound`): la tarea, el trabajador o la asignación no existe.
  - `422` (`InvalidInput` o validación de Pydantic): el payload es inválido por sí solo (esfuerzo 0, disponibilidad 25, fecha pasada).
  - `409` (`Conflict`): la operación choca con el estado actual de los datos (skills no compatibles, tarea `done`, tarea ya asignada, una tarea pierde su día de inicio, borrar con asignaciones).

## 2. Escenarios (BDD)

Los escenarios a probar están definidos en [Escenarios de prueba (BDD)](testing/bdd.md), en formato Dado / Cuando / Entonces y agrupados igual que las [Reglas de Negocio](alcance/negocio.md).

- Cada escenario tiene un ID (`ESC-07`), la regla que cubre (`RN6`) y la capa donde se prueba.
- El test lleva el ID en el nombre: `test_esc07_rechaza_si_faltan_skills` (pytest) o `test("ESC-34 ...")` (Playwright). Así se traza **RN → escenario → test**.
- Los escenarios son especificación, no se ejecutan directamente (no se usa `pytest-bdd`): se implementan como tests normales.
- Flujo de trabajo: primero se escriben todos los tests a partir de los escenarios (en rojo) y la implementación los va pasando a verde.
- **Punto de partida (RED):** la estructura completa existe: entidades, errores y puertos; filas SQL y migración; routers, inyección de dependencias y traducción de errores a HTTP. Lo que no está implementado lanza `NotImplementedError` indicando las reglas que debe cumplir: las funciones de `domain/rules.py`, los casos de uso de `application/` y los repositorios SQL. Las validaciones de los schemas quedan como `TODO RNx`.
- El "Dado" se prepara con las fábricas `make_task`, `make_worker` y `make_assignment`, que tienen la misma firma en las dos capas. En application escriben en los repositorios en memoria y en integration directo en la base. En ningún caso pasan por el caso de uso o la API que se está probando, así cada test falla solo por lo que prueba.

## 3. Dónde vive cada test

Los tests se organizan **por capa y luego por funcionalidad**, no replicando las carpetas de `app/`.

```
backend/tests/
├── dates.py                        # calendario de referencia (FRI_16, MON_19, ...)
├── fakes.py                        # dobles de los puertos: repositorios en memoria y FixedClock
├── unit/                           # reglas puras (prueban app/domain/rules.py)
│   ├── test_skills.py              # ESC-08
│   ├── test_schedule.py            # ESC-09 a ESC-15, ESC-48
│   ├── test_agenda.py              # ESC-38, ESC-39, ESC-46
│   └── test_auto_assign.py         # ESC-23 a ESC-26, ESC-43 a ESC-45, ESC-50
├── application/                    # casos de uso con dobles: sin DB ni HTTP (prueban app/application/)
│   ├── conftest.py                 # repositorios en memoria, reloj fijo, servicios y fábricas
│   ├── test_assign_manually.py     # ESC-17 a ESC-22, ESC-40, ESC-41
│   ├── test_auto_assign_pending.py # ESC-27, ESC-28, ESC-47
│   └── test_edit_delete.py         # ESC-30 a ESC-32, ESC-42
└── integration/                    # adaptadores reales: API + Postgres (taskworkers_test)
    ├── conftest.py                 # client, session con rollback, "hoy" fijo y fábricas
    ├── test_tasks_api.py           # ESC-01 a ESC-04
    ├── test_workers_api.py         # ESC-05 a ESC-07
    ├── test_assignments_api.py     # ESC-16
    ├── test_auto_assign_api.py     # ESC-29
    └── test_errors_api.py          # ESC-37
e2e/tests/
├── smoke.spec.ts                # ESC-33
└── demo.spec.ts                 # ESC-34 a ESC-36
```

## 4. Cómo correrlos

| Comando | Qué corre | Requisito |
|---------|-----------|-----------|
| `make test` | unit + application + integration | `make db` |
| `make test-unit` | solo unit | — |
| `make test-application` | solo application | — |
| `make test-integration` | solo integration (crea `taskworkers_test` si no existe) | `make db` |
| `make test-e2e` | E2E en navegador headless; `HEADED=1` lo abre visible | app corriendo (`db`, `seed`, `backend`, `frontend`) |

Para correr un solo escenario:

```bash
cd backend && uv run pytest -k esc17      # pytest
cd e2e && pnpm test -g "ESC-34"           # Playwright
```
