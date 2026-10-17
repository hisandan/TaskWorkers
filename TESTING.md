# Testing

Estrategia de tests de TaskWorkers: qué se prueba en cada capa, dónde vive y cómo se corre.

---

## 1. Capas

| Capa | Herramienta | Qué cubre | Depende de |
|------|-------------|-----------|------------|
| **Unit** | pytest | Lógica de negocio en `app/services/` (Req3a, Req4) | Nada: funciones puras |
| **Integration** | pytest + `TestClient` | Endpoints de la API + persistencia (Req1–Req4 vía HTTP) | Postgres (`taskworkers_test`) |
| **E2E** | Playwright | Flujos de usuario de punta a punta en el navegador | Stack completo levantado |

Pirámide: muchos unitarios, bastantes de integración, pocos E2E (solo los flujos críticos).

### 1.1 Unit

- Solo `app/services/`. Sin DB, sin HTTP, sin `Session`.
- La lógica de negocio (regla de skills, auto-asignación) se escribe como funciones que reciben datos y devuelven resultados, para poder probarla aislada.
- Las invariantes de Req3a y Req4 se prueban además con **property-based testing** ([Hypothesis](https://hypothesis.readthedocs.io/)), por ejemplo:
  - Ninguna asignación tiene una task cuyas skills no sean subconjunto de las del worker.
  - Ningún worker supera su disponibilidad (horas/día).

### 1.2 Integration

- Usan un Postgres real (no SQLite), en una base separada: `taskworkers_test`. La fixture la crea si no existe y recrea las tablas al inicio de la sesión de tests.
- Cada test corre dentro de una transacción que se revierte al terminar → tests aislados, sin limpiar a mano. Los `commit()` de los endpoints quedan como savepoints.
- El fixture `client` reemplaza `get_session` por la sesión del test, así lo que el test inserta lo ve la API y viceversa.
- Validan códigos HTTP, validación de Pydantic, paginación, errores de negocio (ej. 4xx al violar Req3a) y lo que queda persistido.

### 1.3 E2E

- Viven en `e2e/` (raíz), separados del front y del back porque prueban el sistema completo.
- Corren contra la app levantada con datos de `make seed`.
- Pocos y orientados a flujos: CRUD de tasks/workers, asignación manual rechazada por skills, auto-asignación.

### 1.4 Qué **no** hacemos (por ahora)

| Tipo | Por qué no |
|------|------------|
| Tests de componentes del frontend | Los componentes son CRUD sobre TanStack Query; el contrato lo cubren los tipos generados y los flujos los cubre E2E. Se reconsidera si un componente acumula lógica propia. |
| Carga / performance | Fuera del alcance del ejercicio. |
| Mutation testing, regresión visual | Costo alto frente al beneficio en este tamaño de proyecto. |

### 1.5 Chequeos complementarios (CI)

- **Contrato OpenAPI**: `make api-client && git diff --exit-code frontend/src/api/api.generated.ts` falla si back y front se desincronizan.
- **Estático**: linters y type checkers de back y front.

---

## 2. Estructura

```
backend/tests/
├── unit/                    # services, sin DB
│   └── test_*.py
└── integration/             # API + Postgres
    ├── conftest.py          # engine de test, sesión con rollback, client
    └── test_*_api.py

e2e/
├── playwright.config.ts
└── tests/
    └── *.spec.ts
```

Convenciones:

- Un archivo de test por módulo/recurso: `test_<service>.py` en unit, `test_<recurso>_api.py` en integration.
- Nombre del test = comportamiento esperado: `test_assignment_rejected_when_task_skills_not_subset`.
- Datos de prueba creados en el propio test (o con fixtures); nunca depender del seed en unit/integration.

---

## 3. Cómo correr

```bash
make test               # unit + integration
make test-unit          # solo unitarios (no requiere DB)
make test-integration   # requiere `make db`
make test-e2e           # requiere `make db`, `make seed`, `make backend` y `make frontend`
make test-e2e HEADED=1  # igual, pero con el navegador visible
```

Variables de entorno:

| Variable | Default | Uso |
|----------|---------|-----|
| `TEST_DATABASE_URL` | `postgresql+psycopg://taskworkers:taskworkers@localhost:5432/taskworkers_test` | Base para tests de integración |
| `E2E_BASE_URL` | `http://localhost:4321` | URL del frontend para Playwright |
