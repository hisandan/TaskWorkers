# TaskWorkers

## Índice

1. [Enunciado](#1-enunciado)
2. [Pilares](#2-pilares)
3. [Inicio rápido](#3-inicio-rápido)

---

## 1. Enunciado

Implement an application that covers the following requirements

- **Req1:** Application should CRUD tasks : Task-name, effort (hours), skills, status (done, not-done)
- **Req2:** Application should CRUD workers : worker-name, Availability(hours/day), skills
- **Req3:** Application should allow manual assignment of tasks to workers ( worker, tasks, datestart)
- **Req3a:** Assignment is only allowed if task-skills are a subset of worker-skills.
- **Req4:** Auto-Assignment, implement an auto-assignment feature.

Upload the code to a git repo of your choice and share the link.

it should contain script that

- build / run / test the application.
- Populate the app with data show test/present the app

**Considerations**

hours can be just integers. Working days are mon-fri.

---

## 2. Pilares

Este fue el enfoque para abordar la prueba técnica alrededor de:

| Pilar | Descripción |
|-------|-------------|
| [1. Definición de Alcance (Requerimientos)](docs/alcance.md) | Decisiones sobre cómo interpretar el enunciado: qué entra, qué no y las reglas de negocio. |
| [2. Arquitectura y Stack Elegidos](docs/arquitectura.md) | Decisiones sobre el stack, el diseño y la estructura de carpetas. |
| [3. Enfoque en Testing](docs/testing.md) | Decisiones sobre qué probar en cada capa, dónde vive cada test y cómo correrlos. |
| [4. Modelado de Flujos y Entidades](docs/diagramas.md) | Decisiones sobre las entidades, sus relaciones y los flujos principales, con diagramas. |
| [5. Fortalezas y Debilidades](docs/dofa.md) | Decisiones sobre qué se priorizó, qué quedó pendiente y qué se mejoraría. |
| [6. Archivos Core](docs/archivos-core.md) | Principales archivos y qué encontrar en cada uno. |

---

## 3. Inicio rápido

**Requisitos:** [Docker](https://www.docker.com/), [uv](https://docs.astral.sh/uv/) (Python ≥ 3.13), [Node.js](https://nodejs.org/) ≥ 22.22 + [pnpm](https://pnpm.io/), `make`.

```bash
# Construir
make build      # instala dependencias, sincroniza los tipos de la API y construye el frontend

# Correr
make db         # Postgres en Docker
make seed       # crea las tablas y carga datos de demo (dummy)
make backend    # API → http://localhost:8000/docs
make frontend   # Web → http://localhost:4321 (en otra terminal)

# Probar
make test               # unit + integration
make test-e2e           # E2E (requiere la app corriendo)

# Otros
make api-client         # regenera los tipos TS del frontend desde el OpenAPI
```

---

> **Nota sobre el uso de IA:** en varias partes de la solución usé Claude Code como asistente de código. Normalmente lo combino con metodologías más robustas como [AI-DLC de AWS](https://github.com/awslabs/aidlc-workflows). Sin embargo, con ánimo de enfocarse en construir una prueba de concepto pueda exponer a profundidad en poco tiempo, definí usarlo para tareas muy específicas.
