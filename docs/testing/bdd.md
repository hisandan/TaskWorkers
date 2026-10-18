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

### ESC-48 · Si la tarea anterior termina antes del inicio, no le quita horas · edge
`RN15`, `RN20` · `unit`

- **Dado** que la última tarea del trabajador es A de 4 h el lun 19 (le sobran 2 h ese día)
- **Cuando** programo la tarea B de 4 h desde mar 20, después de A
- **Entonces** B inicia y termina el mar 20 (no usa las 2 h libres del lun 19)

Archivo: `backend/tests/unit/test_agenda.py`

### ESC-38 · La agenda se ordena por inicio y corre el fin de las siguientes
`RN15`, `RN26` · `unit`

- **Dado** que el trabajador tiene B (4 h, inicio mar 20) y C (6 h, inicio mié 21)
- **Cuando** se agrega A (10 h, inicio lun 19) y calculo la agenda
- **Entonces** A va lun 19 a mar 20, B mar 20 a mié 21 y C mié 21 a jue 22

### ESC-39 · Detecta las tareas que pierden su día de inicio · edge
`RN15`, `RN25` · `unit`

- **Dado** la misma agenda de ESC-38
- **Cuando** A tiene `<esfuerzo>`
- **Entonces** las tareas que pierden su día de inicio son `<resultado>`

| esfuerzo de A | resultado | nota |
|---------------|-----------|------|
| 12 h | B | llena lun y mar |
| 11 h | ninguna | edge: a B le queda exactamente 1 h el mar 20 |

- **Y si** dos tareas inician el mismo día y la primera lo llena, la que se asignó después es la que pierde su día de inicio

### ESC-46 · El corrimiento se revisa en toda la agenda · edge
`RN15`, `RN25` · `unit`

- **Dado** la agenda `<agenda>`
- **Cuando** se agrega `<nueva>`
- **Entonces** las tareas que pierden su día de inicio son `<resultado>`

| agenda | nueva | resultado | nota |
|--------|-------|-----------|------|
| B (8 h, inicio mar 20), C (2 h, inicio mié 21) | A (10 h, inicio lun 19) | C | B conserva su día, pero empuja a C fuera del suyo |
| B (4 h, inicio jue 22) | A (10 h, inicio lun 19) | ninguna | el hueco de mar 20 y mié 21 absorbe el corrimiento; B no cambia sus fechas |
| X (12 h, inicio vie 16) | Y (1 h, inicio lun 19) | Y | X llena el lun 19 desde el viernes |

---

## 5. Asignación manual (Req3, Req3a)

Archivos: `backend/tests/integration/test_assignments_api.py` (ESC-16) y `backend/tests/application/test_assign_manually.py` (ESC-17 a ESC-22, ESC-40 y ESC-41)

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

### ESC-40 · Asignar en medio de la agenda corre el fin de las siguientes
`RN25`, `RN26` · `application`

- **Dado** que "Ana" (6 h/día) tiene B (4 h, inicio mar 20) y C (6 h, inicio mié 21)
- **Cuando** le asigno A (10 h) con inicio lun 19
- **Entonces** la asignación se crea (lun 19 a mar 20) y al listar, B termina el mié 21 y C el jue 22, sin cambiar sus inicios

### ESC-41 · Rechaza si alguna tarea pierde su día de inicio · edge
`RN25` · `application`

- **Cuando** `<caso>`
- **Entonces** se rechaza (`WorkerBusy`) y la tarea sigue sin asignar

| caso |
|------|
| asigno A (12 h) con inicio lun 19 y "Ana" tiene B (4 h, inicio mar 20): B pierde el mar 20 |
| asigno Y (1 h) con inicio lun 19 y "Ana" ya tiene X (6 h) ese día: Y no trabaja el lun 19 |

---

## 6. Auto-asignación (Req4)

Archivos: `backend/tests/unit/test_auto_assign.py` (ESC-23 a ESC-26, ESC-43 a ESC-45), `backend/tests/application/test_auto_assign_pending.py` (ESC-27, ESC-28) y `backend/tests/integration/test_auto_assign_api.py` (ESC-29)

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

### ESC-43 · Recorre primero las tareas con menos candidatos
`RN27` · `unit`

- **Dado** "Luis" (id 1, `{python, rust}`) y "Ana" (id 2, `{python}`), ambos con 6 h/día y libres, y las tareas "Genérica" (id 1, 6 h, `{python}`) y "Especial" (id 2, 6 h, `{rust}`)
- **Cuando** auto-asigno desde lun 19
- **Entonces** "Especial" queda en "Luis" y "Genérica" en "Ana", y ambas terminan el lun 19 (recorriendo por id, "Especial" terminaría el mar 20)

### ESC-44 · Si tienen los mismos candidatos, va primero la de menor id
`RN27` · `unit`

- **Dado** "Ana" (6 h/día, libre) y las tareas T2 y T1 de 6 h, recibidas en ese orden
- **Cuando** auto-asigno desde lun 19
- **Entonces** T1 termina el lun 19 y T2 el mar 20

### ESC-45 · Si dos candidatos terminan el mismo día, gana el de menor id
`RN28` · `unit`

- **Dado** "Ana" (id 2) y "Luis" (id 1), ambos con 6 h/día, libres y con las mismas skills
- **Cuando** auto-asigno una tarea de 6 h desde lun 19
- **Entonces** queda asignada a "Luis"

### ESC-27 · Asigna solo las tareas pendientes y no toca las existentes
`RN17` · `application`

- **Dado** las tareas:
  - T1 y T2: `not-done`, sin asignar
  - T3: asignada a "Ana"
  - T4: `done`, sin asignar
- **Cuando** llamo a la auto-asignación
- **Entonces** T1 y T2 quedan asignadas, T3 conserva su asignación original y T4 sigue sin asignar

### ESC-28 · La fecha de inicio es el siguiente día hábil después de hoy
`RN20` · `application`

- **Dado** que hoy es `<hoy>` y los trabajadores tienen la agenda libre
- **Cuando** llamo a la auto-asignación
- **Entonces** las asignaciones creadas inician el `<inicio>`

| hoy | inicio | nota |
|-----|--------|------|
| lun 19 | mar 20 | hoy es hábil: inicia mañana |
| vie 23 | lun 26 | edge: mañana es sábado |
| sáb 24 | lun 26 | |

### ESC-47 · Con la agenda ocupada, se guarda el primer día en que la tarea trabaja · edge
`RN20`, `RN25`, `RN29` · `application`

- **Dado** que hoy es lun 19, "Ana" (6 h/día) es la única candidata y tiene la agenda `<agenda>`
- **Cuando** auto-asigno la tarea T (4 h)
- **Entonces** la asignación de T se guarda con inicio `<inicio>` y termina el `<fin>`

| agenda | inicio | fin | nota |
|--------|--------|-----|------|
| P (6 h, inicio vie 16, `done`) | mar 20 | mar 20 | la tarea pasada no cuenta |
| B (4 h, inicio lun 19) | mar 20 | mar 20 | no usa las 2 h que sobran hoy |
| B (10 h, inicio mar 20) | mié 21 | jue 22 | usa las 2 h que sobran del mié |
| B (12 h, inicio mar 20) | jue 22 | jue 22 | el mié está lleno |

### ESC-29 · La respuesta reporta las tareas que no se pudieron asignar
`RN21` · `integration`

- **Dado** la tarea "Migrar" (`{rust}`) y ningún trabajador con `rust`
- **Cuando** llamo a la auto-asignación
- **Entonces** responde `200`, "Migrar" aparece en las no asignadas y no se crea ninguna asignación para ella

---

## 7. Edición y borrado

Archivo: `backend/tests/application/test_edit_delete.py`

### ESC-30 · Editar después de asignar recalcula las fechas
`RN22`, `RN26` · `application`

- **Dado** que "API" (10 h) está asignada a "Ana" (6 h/día) con inicio lun 19, y termina el mar 20
- **Cuando** `<edición>`
- **Entonces** la asignación conserva su inicio lun 19 y termina el `<fin>`

| edición | fin |
|---------|-----|
| cambio el esfuerzo de "API" a 20 h | jue 22 |
| cambio la disponibilidad de "Ana" a 10 h | lun 19 |

### ESC-31 · Marcar una tarea `done` conserva su asignación
`RN23` · `application`

- **Dado** que "API" (10 h) está asignada a "Ana" (6 h/día) con inicio lun 19
- **Cuando** marco "API" como `done`
- **Entonces** la asignación sigue existiendo, de lun 19 a mar 20

### ESC-42 · Rechaza editar si rompe las skills o la agenda · edge
`RN6`, `RN22`, `RN25` · `application`

- **Dado** que "Ana" (6 h/día, `{python}`) tiene "API" (10 h, `{python}`, inicio lun 19) y "Siguiente" (4 h, inicio mar 20)
- **Cuando** `<edición>`
- **Entonces** se rechaza (`<error>`) y ni la tarea ni el trabajador cambian

| edición | error | motivo |
|---------|-------|--------|
| cambio el esfuerzo de "API" a 12 h | `WorkerBusy` | "Siguiente" pierde el mar 20 |
| cambio las skills de "API" a `{python, sql}` | `MissingSkills` | "Ana" no tiene `sql` |
| cambio las skills de "Ana" a `{sql}` | `MissingSkills` | sus tareas piden `python` |
| cambio la disponibilidad de "Ana" a 5 h | `WorkerBusy` | "Siguiente" pierde el mar 20 |

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

### ESC-49 · Eliminar una asignación libera la tarea y adelanta la agenda
`RN24`, `RN26`, `RN30` · `application`

- **Dado** que "Ana" (6 h/día) tiene A (10 h, inicio lun 19, termina mar 20) y B (4 h, inicio mar 20, termina mié 21)
- **Cuando** elimino la asignación de A
- **Entonces** A queda sin asignar, y B conserva su inicio mar 20 y ahora termina el mar 20
- **Y cuando** borro la tarea A, se borra

---

## 8. Errores en la API

Archivo: `backend/tests/integration/test_errors_api.py`

### ESC-37 · Cada error de dominio responde su código HTTP
`RN6`, `RN8`, `RN9`, `RN11`, `RN24`, `RN25` · `integration`

Las reglas ya se prueban en application; aquí solo se verifica que el adaptador HTTP traduzca cada error según la [convención de códigos](../testing.md#1-qué-se-prueba-en-cada-capa).

- **Dado** el trabajador "Ana" (`{python}`) con la tarea "Asignada" (10 h, inicio lun 19), y las tareas "API" (`{python}`), "Reportes" (`{python, sql}`) y "Documentación" (`done`)
- **Cuando** `<petición>`
- **Entonces** responde `<código>`

| petición | error de dominio | código |
|----------|------------------|--------|
| asigno "Reportes" a "Ana" | `MissingSkills` | `409` |
| asigno "Documentación" a "Ana" | `TaskDone` | `409` |
| asigno "Asignada" a "Ana" | `TaskAlreadyAssigned` | `409` |
| asigno "API" a "Ana" con inicio lun 19 (ya está lleno) | `WorkerBusy` | `409` |
| borro a "Ana" | `HasAssignments` | `409` |
| asigno "API" con inicio vie 16 | `StartInPast` | `422` |
| asigno una tarea que no existe | `TaskNotFound` | `404` |
| asigno "API" a un trabajador que no existe | `WorkerNotFound` | `404` |
| elimino una asignación que no existe | `AssignmentNotFound` | `404` |

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
| RN6 | ESC-08, ESC-17, ESC-35, ESC-37, ESC-42 |
| RN7 | ESC-08, ESC-18 |
| RN8 | ESC-19, ESC-37 |
| RN9 | ESC-20, ESC-37 |
| RN10 | por diseño: el endpoint recibe una sola tarea |
| RN11 | ESC-21, ESC-37 |
| RN12 | ESC-11 |
| RN13 | ESC-12, ESC-22 |
| RN14 | ESC-09, ESC-10, ESC-11, ESC-15, ESC-16 |
| RN15 | ESC-13, ESC-14, ESC-38, ESC-39, ESC-46 |
| RN16 | ESC-09, ESC-10, ESC-14, ESC-15 |
| RN17 | ESC-27 |
| RN18 | ESC-26 |
| RN19 | ESC-23, ESC-24, ESC-25 |
| RN20 | ESC-28, ESC-47, ESC-48 |
| RN21 | ESC-26, ESC-29 |
| RN22 | ESC-30, ESC-42 |
| RN23 | ESC-31 |
| RN24 | ESC-32, ESC-37, ESC-49 |
| RN25 | ESC-37, ESC-39, ESC-40, ESC-41, ESC-42, ESC-46, ESC-47 |
| RN26 | ESC-30, ESC-38, ESC-40, ESC-49 |
| RN27 | ESC-43, ESC-44 |
| RN28 | ESC-45 |
| RN29 | ESC-47 |
| RN30 | ESC-37, ESC-49 |

---

## 11. Preguntas abiertas

Al escribir los escenarios aparecieron ambigüedades que las reglas actuales no resuelven. Una vez decididas, pasan a [Reglas de Negocio](../alcance/negocio.md) como reglas nuevas y se agregan sus escenarios.

**Resueltas:**

- **Asignación manual con agenda ocupada:** la tarea se inserta en la agenda y puede correr el fin de las siguientes, siempre que todas conserven al menos 1 h en su día de inicio; si no, `409`. Pasó a RN25 y RN26 (ESC-38 a ESC-42).
- **"Siguiente día hábil a partir de hoy" (RN20):** inicia mañana, o el lunes si mañana es fin de semana. Pasó a RN20 (ESC-28).
- **Algoritmo de la auto-asignación:** v1 provisional: las tareas se recorren *most-constrained-first* y, si empatan, por menor id. Pasó a RN27 (ESC-43, ESC-44).
- **Empate en RN19:** v1 provisional: gana el candidato de menor id. Pasó a RN28 (ESC-45).
- **Inicio de la auto-asignación con la agenda ocupada:** se guarda el primer día en que la tarea trabaja horas, y las tareas que terminan antes de la fecha de RN20 no cuentan. Pasó a RN20 y RN29 (ESC-47, ESC-48).
- **Desasignar:** se puede eliminar una asignación y después borrar la tarea. Pasó a RN30 (ESC-49).

**Pendiente de mejorar:** RN27 y RN28 son una primera versión. El algoritmo está aislado en `task_priority` y `worker_priority` (`app/domain/rules.py`); al cambiarlo, ESC-23 a ESC-26 deben seguir pasando y ESC-43 a ESC-45 se reemplazan por los escenarios de la nueva versión.
