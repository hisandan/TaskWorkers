[← Volver a README](../../README.md) · [← Volver a Enfoque en Testing](../testing.md)

# Escenarios de prueba (BDD)

**Objetivo:** definir qué se prueba concretamente, escenario por escenario, a partir de las [Reglas de Negocio](../alcance/negocio.md).

> Cada escenario indica la regla que cubre (`RN`) y la capa donde se prueba (`unit`, `application`, `integration`, `e2e`). Los marcados con **edge** son casos borde. En `application`, "se rechaza" significa que el caso de uso lanza el error de dominio indicado; su código HTTP se prueba una sola vez en [ESC-37](#esc-37--cada-error-de-dominio-responde-su-código-http).

## Índice

0. [Datos de referencia](#0-datos-de-referencia)
1. [Tareas (Req1)](#1-tareas-req1)
2. [Trabajadores (Req2)](#2-trabajadores-req2)
3. [Compatibilidad de skills](#3-compatibilidad-de-skills)
4. [Cálculo de fechas](#4-cálculo-de-fechas)
5. [Asignación manual (Req3, Req3a)](#5-asignación-manual-req3-req3a)
6. [Auto-asignación (Req4)](#6-auto-asignación-req4)
7. [Edición y borrado](#7-edición-y-borrado)
8. [Errores en la API](#8-errores-en-la-api)
9. [Flujos de la demo (E2E)](#9-flujos-de-la-demo-e2e)
10. [Trazabilidad](#10-trazabilidad)
11. [Preguntas abiertas](#11-preguntas-abiertas)

---

## 0. Datos de referencia

Para que las fechas sean fijas, los escenarios usan este calendario:

| vie | sáb | dom | lun | mar | mié | jue | vie | sáb | dom | lun |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 16-oct | 17-oct | 18-oct | **19-oct** | 20-oct | 21-oct | 22-oct | 23-oct | 24-oct | 25-oct | 26-oct |

- En application e integration, **hoy = lun 19-oct-2026** salvo que el escenario diga otra cosa.
- Salvo que se indique, el trabajador tiene **6 h/día**.

---

## 1. Tareas (Req1)

Archivo: `backend/tests/integration/test_tasks_api.py`

### ESC-01 · Una tarea nueva nace `not-done`
`RN2` · `integration`

- **Dado** que no existe ninguna tarea
- **Cuando** creo la tarea "API" con esfuerzo 10 y skills `{python}` sin indicar estado
- **Entonces** responde `201` y la tarea tiene estado `not-done`

### ESC-02 · Rechaza un esfuerzo inválido · edge
`RN1` · `integration`

- **Cuando** creo una tarea con esfuerzo `<esfuerzo>`
- **Entonces** responde `422` y no se crea la tarea

| esfuerzo | motivo |
|----------|--------|
| `0` | debe ser mayor que 0 |
| `-3` | debe ser mayor que 0 |
| `2.5` | debe ser entero |

### ESC-03 · Rechaza un estado fuera de `done` / `not-done`
`RN2` · `integration`

- **Cuando** creo o edito una tarea con estado `"in-progress"`
- **Entonces** responde `422`

### ESC-04 · CRUD completo de una tarea
`Req1` · `integration`

- **Dado** que creo la tarea "API"
- **Cuando** la consulto, edito su nombre, esfuerzo, skills y estado, y la listo
- **Entonces** cada paso devuelve los datos actualizados
- **Y cuando** la borro, consultarla responde `404`

---

## 2. Trabajadores (Req2)

Archivo: `backend/tests/integration/test_workers_api.py`

### ESC-05 · Crea un trabajador con disponibilidad y skills
`Req2` · `integration`

- **Cuando** creo el trabajador "Ana" con disponibilidad 6 y skills `{python, sql}`
- **Entonces** responde `201` con esos datos

### ESC-06 · Valida el rango de disponibilidad · edge
`RN4` · `integration`

- **Cuando** creo un trabajador con disponibilidad `<horas>`
- **Entonces** responde `<código>`

| horas | código |
|-------|--------|
| `0` | `422` |
| `25` | `422` |
| `4.5` | `422` |
| `1` | `201` |
| `24` | `201` |

### ESC-07 · CRUD completo de un trabajador
`Req2` · `integration`

- **Dado** que creo el trabajador "Ana"
- **Cuando** lo consulto, edito su nombre, disponibilidad y skills, y lo listo
- **Entonces** cada paso devuelve los datos actualizados
- **Y cuando** lo borro, consultarlo responde `404`

---

## 3. Compatibilidad de skills

Archivo: `backend/tests/unit/test_skills.py`

### ESC-08 · Un trabajador puede tomar una tarea si tiene todas sus skills
`RN6`, `RN7` · `unit`

- **Dado** una tarea con skills `<tarea>` y un trabajador con skills `<trabajador>`
- **Cuando** verifico si el trabajador puede tomar la tarea
- **Entonces** el resultado es `<puede>`

| tarea | trabajador | puede | nota |
|-------|------------|-------|------|
| `{python}` | `{python, sql}` | sí | subconjunto |
| `{python, sql}` | `{python, sql}` | sí | iguales |
| `{python, sql}` | `{python}` | no | falta `sql` |
| `{python}` | `{}` | no | edge: trabajador sin skills |
| `{}` | `{python}` | sí | edge: RN7 |
| `{}` | `{}` | sí | edge: RN7 |

---

## 4. Cálculo de fechas

Archivo: `backend/tests/unit/test_schedule.py`

### ESC-09 · La tarea cabe en el día
`RN14`, `RN16` · `unit`

- **Dado** un trabajador sin agenda
- **Cuando** programo una tarea de 4 h desde lun 19
- **Entonces** inicia y termina el lun 19

### ESC-10 · La tarea ocupa exactamente la disponibilidad del día · edge
`RN14`, `RN16` · `unit`

- **Cuando** programo una tarea de 6 h desde lun 19
- **Entonces** termina el lun 19 (no se pasa al martes)

### ESC-11 · La tarea cruza el fin de semana
`RN12`, `RN14` · `unit`

- **Cuando** programo una tarea de 10 h desde vie 16
- **Entonces** trabaja vie 6 h y lun 4 h, y termina el lun 19

### ESC-12 · Si inicia en fin de semana, se mueve al lunes · edge
`RN13` · `unit`

- **Cuando** programo una tarea de 4 h desde `<inicio>`
- **Entonces** inicia y termina el lun 19

| inicio |
|--------|
| sáb 17 |
| dom 18 |

### ESC-13 · La siguiente tarea usa las horas que sobran del día
`RN15` · `unit`

- **Dado** que el trabajador tiene la tarea A de 10 h desde vie 16 (termina lun 19 con 4 h usadas)
- **Cuando** programo la tarea B de 5 h
- **Entonces** B trabaja lun 2 h y mar 3 h, y termina el mar 20

### ESC-14 · Si el día quedó lleno, la siguiente tarea empieza al día hábil siguiente · edge
`RN15`, `RN16` · `unit`

- **Dado** que el trabajador tiene la tarea A de 6 h el lun 19
- **Cuando** programo la tarea B de 1 h
- **Entonces** B inicia y termina el mar 20

### ESC-15 · Tarea de varios días · edge
`RN14`, `RN16` · `unit`

- **Cuando** programo una tarea de `<esfuerzo>` desde lun 19
- **Entonces** termina el `<fin>`

| esfuerzo | fin | nota |
|----------|-----|------|
| 30 h | vie 23 | llena la semana exacta |
| 31 h | lun 26 | sobra 1 h, cruza el fin de semana |

---

## 5. Asignación manual (Req3, Req3a)

Archivos: `backend/tests/integration/test_assignments_api.py` (ESC-16) y `backend/tests/application/test_assign_manually.py` (ESC-17 a ESC-22)

### ESC-16 · Asignación válida devuelve las fechas calculadas
`Req3`, `RN14` · `integration`

- **Dado** el trabajador "Ana" (6 h/día, `{python}`) y la tarea "API" (10 h, `{python}`)
- **Cuando** asigno "API" a "Ana" con inicio lun 19
- **Entonces** responde `201` con inicio lun 19 y fin mar 20, y la asignación aparece al listar

### ESC-17 · Rechaza si al trabajador le faltan skills
`RN6` · `application`

- **Dado** el trabajador "Ana" (`{python}`) y la tarea "Reportes" (`{python, sql}`)
- **Cuando** asigno "Reportes" a "Ana"
- **Entonces** se rechaza (`MissingSkills`) y la tarea sigue sin asignar

### ESC-18 · Una tarea sin skills la puede tomar cualquiera · edge
`RN7` · `application`

- **Dado** el trabajador "Luis" sin skills y la tarea "Limpieza" sin skills
- **Cuando** asigno "Limpieza" a "Luis"
- **Entonces** la asignación se crea

### ESC-19 · Rechaza asignar una tarea `done`
`RN8` · `application`

- **Dado** la tarea "API" con estado `done`
- **Cuando** la asigno a un trabajador compatible
- **Entonces** se rechaza (`TaskDone`)

### ESC-20 · Rechaza asignar una tarea ya asignada
`RN9` · `application`

- **Dado** que "API" ya está asignada a "Ana"
- **Cuando** la asigno a `<trabajador>`
- **Entonces** se rechaza (`TaskAlreadyAssigned`) y la asignación original no cambia

| trabajador |
|------------|
| "Luis" (otro compatible) |
| "Ana" (el mismo) |

### ESC-21 · La fecha de inicio no puede estar en el pasado · edge
`RN11` · `application`

- **Dado** que hoy es lun 19
- **Cuando** asigno una tarea con inicio `<inicio>`
- **Entonces** `<resultado>`

| inicio | resultado |
|--------|-----------|
| vie 16 | se rechaza (`StartInPast`) |
| lun 19 (hoy) | la asignación se crea |

### ESC-22 · Si el inicio cae en fin de semana, la asignación arranca el lunes
`RN13` · `application`

- **Cuando** asigno una tarea de 4 h con inicio sáb 24
- **Entonces** la asignación inicia el lun 26 y termina el lun 26

---

## 6. Auto-asignación (Req4)

Archivos: `backend/tests/unit/test_auto_assign.py` (ESC-23 a ESC-26), `backend/tests/application/test_auto_assign_pending.py` (ESC-27, ESC-28) y `backend/tests/integration/test_auto_assign_api.py` (ESC-29)

### ESC-23 · Elige al que termina antes según su agenda
`RN19` · `unit`

- **Dado** "Ana" y "Luis" (6 h/día, mismas skills); Ana está ocupada hasta el mié 21 y Luis está libre
- **Cuando** auto-asigno una tarea de 6 h desde lun 19
- **Entonces** queda asignada a "Luis" (termina lun 19)

### ESC-24 · Elige al que termina antes según su disponibilidad
`RN19` · `unit`

- **Dado** "Ana" (8 h/día) y "Luis" (4 h/día), ambos libres y con las mismas skills
- **Cuando** auto-asigno una tarea de 8 h desde lun 19
- **Entonces** queda asignada a "Ana" (termina lun 19; Luis terminaría mar 20)

### ESC-25 · La agenda se actualiza dentro de la misma corrida
`RN19` · `unit`

- **Dado** "Ana" y "Luis" (6 h/día, libres, mismas skills) y las tareas T1 y T2 de 6 h
- **Cuando** auto-asigno desde lun 19
- **Entonces** T1 y T2 quedan en trabajadores distintos y ambas terminan el lun 19

### ESC-26 · Si nadie tiene las skills, la tarea queda sin asignar · edge
`RN18`, `RN21` · `unit`

- **Dado** una tarea con skills `{rust}` y ningún trabajador con `rust`
- **Cuando** auto-asigno
- **Entonces** la tarea queda en la lista de no asignadas

### ESC-27 · Asigna solo las tareas pendientes y no toca las existentes
`RN17` · `application`

- **Dado** las tareas:
  - T1 y T2: `not-done`, sin asignar
  - T3: asignada a "Ana"
  - T4: `done`, sin asignar
- **Cuando** llamo a la auto-asignación
- **Entonces** T1 y T2 quedan asignadas, T3 conserva su asignación original y T4 sigue sin asignar

### ESC-28 · La fecha de inicio es el siguiente día hábil
`RN20` · `application`

- **Dado** que hoy es sáb 24
- **Cuando** llamo a la auto-asignación
- **Entonces** las asignaciones creadas inician el lun 26

### ESC-29 · La respuesta reporta las tareas que no se pudieron asignar
`RN21` · `integration`

- **Dado** la tarea "Migrar" (`{rust}`) y ningún trabajador con `rust`
- **Cuando** llamo a la auto-asignación
- **Entonces** responde `200`, "Migrar" aparece en las no asignadas y no se crea ninguna asignación para ella

---

## 7. Edición y borrado

Archivo: `backend/tests/application/test_edit_delete.py`

### ESC-30 · Editar después de asignar no recalcula la asignación
`RN22` · `application`

- **Dado** que "API" (`{python}`) está asignada a "Ana" (`{python}`)
- **Cuando** `<edición>`
- **Entonces** la asignación sigue existiendo con las mismas fechas

| edición |
|---------|
| cambio las skills de "Ana" a `{sql}` |
| cambio el esfuerzo de "API" a 20 h |

### ESC-31 · Marcar una tarea `done` conserva su asignación
`RN23` · `application`

- **Dado** que "API" está asignada a "Ana"
- **Cuando** marco "API" como `done`
- **Entonces** la asignación sigue existiendo con las mismas fechas

### ESC-32 · No se borra lo que tiene asignaciones · edge
`RN24` · `application`

- **Cuando** borro `<entidad>`
- **Entonces** `<resultado>`

| entidad | resultado |
|---------|-----------|
| un trabajador con asignaciones | se rechaza (`HasAssignments`) |
| una tarea con asignación | se rechaza (`HasAssignments`) |
| un trabajador sin asignaciones | se borra |
| una tarea sin asignación | se borra |

---

## 8. Errores en la API

Archivo: `backend/tests/integration/test_errors_api.py`

### ESC-37 · Cada error de dominio responde su código HTTP
`RN6`, `RN8`, `RN9`, `RN11`, `RN24` · `integration`

Las reglas ya se prueban en application; aquí solo se verifica que el adaptador HTTP traduzca cada error según la [convención de códigos](../testing.md#1-qué-se-prueba-en-cada-capa).

- **Dado** el trabajador "Ana" (`{python}`) con la tarea "Asignada", y las tareas "API" (`{python}`), "Reportes" (`{python, sql}`) y "Documentación" (`done`)
- **Cuando** `<petición>`
- **Entonces** responde `<código>`

| petición | error de dominio | código |
|----------|------------------|--------|
| asigno "Reportes" a "Ana" | `MissingSkills` | `409` |
| asigno "Documentación" a "Ana" | `TaskDone` | `409` |
| asigno "Asignada" a "Ana" | `TaskAlreadyAssigned` | `409` |
| borro a "Ana" | `HasAssignments` | `409` |
| asigno "API" con inicio vie 16 | `StartInPast` | `422` |
| asigno una tarea que no existe | `TaskNotFound` | `404` |
| asigno "API" a un trabajador que no existe | `WorkerNotFound` | `404` |

---

## 9. Flujos de la demo (E2E)

Archivos: `e2e/tests/smoke.spec.ts` (ESC-33) y `e2e/tests/demo.spec.ts` (ESC-34 a ESC-36). Corren sobre los datos de `make seed`.

### ESC-33 · La aplicación carga
`smoke` · `e2e`

- **Cuando** abro la página principal
- **Entonces** carga sin errores

### ESC-34 · Crear, asignar y ver fechas
`Req1`, `Req2`, `Req3` · `e2e`

- **Cuando** desde la interfaz creo el trabajador "Ana" (6 h/día, `{python}`) y la tarea "API" (10 h, `{python}`), y asigno "API" a "Ana" con inicio el próximo lunes
- **Entonces** veo la asignación con su fecha de inicio y de fin

### ESC-35 · La interfaz muestra por qué se rechaza una asignación
`Req3a` · `e2e`

- **Cuando** intento asignar una tarea a un trabajador al que le faltan skills
- **Entonces** veo un mensaje de error y la tarea sigue sin asignar

### ESC-36 · Auto-asignar desde la interfaz
`Req4` · `e2e`

- **Cuando** pulso "Auto-asignar"
- **Entonces** veo qué tareas se asignaron (a quién y con qué fechas) y cuáles quedaron sin asignar

---

## 10. Trazabilidad

| Regla | Escenarios |
|-------|------------|
| RN1 | ESC-02 |
| RN2 | ESC-01, ESC-03 |
| RN3 | por diseño: las skills son etiquetas sin nivel |
| RN4 | ESC-06 |
| RN5 | por diseño: la disponibilidad es un solo entero por día |
| RN6 | ESC-08, ESC-17, ESC-35, ESC-37 |
| RN7 | ESC-08, ESC-18 |
| RN8 | ESC-19, ESC-37 |
| RN9 | ESC-20, ESC-37 |
| RN10 | por diseño: el endpoint recibe una sola tarea |
| RN11 | ESC-21, ESC-37 |
| RN12 | ESC-11 |
| RN13 | ESC-12, ESC-22 |
| RN14 | ESC-09, ESC-10, ESC-11, ESC-15, ESC-16 |
| RN15 | ESC-13, ESC-14 |
| RN16 | ESC-09, ESC-10, ESC-14, ESC-15 |
| RN17 | ESC-27 |
| RN18 | ESC-26 |
| RN19 | ESC-23, ESC-24, ESC-25 |
| RN20 | ESC-28 |
| RN21 | ESC-26, ESC-29 |
| RN22 | ESC-30 |
| RN23 | ESC-31 |
| RN24 | ESC-32, ESC-37 |

---

## 11. Preguntas abiertas

Al escribir los escenarios aparecieron ambigüedades que las reglas actuales no resuelven. Una vez decididas, pasan a [Reglas de Negocio](../alcance/negocio.md) como reglas nuevas y se agregan sus escenarios.

1. **Asignación manual con agenda ocupada:** si "Ana" está ocupada hasta el mar 20 y asigno una tarea con inicio lun 19, ¿se rechaza (`409`) o se programa al terminar su agenda? *Propuesta:* programarla al terminar y devolver la fecha real, igual que RN13 mueve el fin de semana al lunes.
2. **Orden de la auto-asignación:** ¿en qué orden recorre las tareas? Esto cambia el resultado. *Propuesta:* por orden de creación (id).
3. **Empate en RN19:** si dos candidatos terminan el mismo día, ¿a quién elige? *Propuesta:* al de menor id, para que sea determinista.
4. **"Siguiente día hábil a partir de hoy" (RN20):** si hoy es hábil, ¿inicia hoy o mañana? *Propuesta:* hoy, coherente con RN11, que permite asignar con inicio hoy.
