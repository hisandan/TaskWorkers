[← Volver a README](../../README.md) · [← Volver a Definición de Alcance (Requerimientos)](../alcance.md)

# Reglas de Negocio

**Objetivo:** listar las condiciones que el sistema respeta siempre, indicando cuáles vienen del enunciado y cuáles son decisiones propias.

> **(enunciado)** = viene explícito en la prueba. **(decisión)** = la definí para eliminar una ambigüedad.

## Índice

1. [Tareas (Req1)](#1-tareas-req1)
2. [Trabajadores (Req2)](#2-trabajadores-req2)
3. [Asignación manual (Req3, Req3a)](#3-asignación-manual-req3-req3a)
4. [Cálculo de fechas](#4-cálculo-de-fechas)
5. [Auto-asignación (Req4)](#5-auto-asignación-req4)
6. [Edición y borrado](#6-edición-y-borrado)

---

## 1. Tareas (Req1)

- **RN1:** El esfuerzo es un número entero de horas **(enunciado)**, mayor que 0 **(decisión)**.
- **RN2:** El estado es `done` o `not-done` **(enunciado)**; una tarea nueva nace `not-done` **(decisión)**.
- **RN3:** Una skill se tiene o no se tiene, sin niveles **(decisión)**. Las skills se guardan en una tabla propia, compartida por tareas y trabajadores, para cruzarlos fácilmente.

## 2. Trabajadores (Req2)

- **RN4:** La disponibilidad es un número entero de horas por día **(enunciado)**, entre 1 y 24 **(decisión)**.
- **RN5:** La disponibilidad es la misma todos los días hábiles; no se distingue en qué horas del día **(decisión)**.

## 3. Asignación manual (Req3, Req3a)

- **RN6:** Solo se asigna si las skills de la tarea son un subconjunto de las del trabajador **(enunciado)**.
- **RN7:** Una tarea sin skills la puede tomar cualquier trabajador (el conjunto vacío es subconjunto de todos) **(decisión)**.
- **RN8:** Solo se asignan tareas `not-done` **(decisión)**.
- **RN9:** Una tarea se asigna a un solo trabajador y una sola vez; no se reparte entre varios **(decisión)**.
- **RN10:** La asignación manual es de una tarea a la vez; para asignar varias de una sola vez está la auto-asignación **(decisión)**.
- **RN11:** La fecha de inicio no puede estar en el pasado **(decisión)**.

## 4. Cálculo de fechas

- **RN12:** Solo se trabaja de lunes a viernes **(enunciado)**; no hay festivos ni vacaciones **(decisión)**.
- **RN13:** Si la fecha de inicio cae en fin de semana, se mueve al lunes siguiente **(decisión)**.
- **RN14:** Cada día el trabajador consume hasta su disponibilidad; si la tarea no cabe, continúa al inicio del siguiente día hábil **(decisión)**.
- **RN15:** Las tareas de un trabajador se ejecutan una tras otra y de corrido, sin solaparse ni intercalarse, en orden de fecha de inicio; si dos inician el mismo día, va primero la que se asignó antes. La siguiente tarea usa las horas que sobran del día **(decisión)**.
- **RN16:** La fecha de fin es el último día hábil en que se trabajan horas de la tarea **(decisión)**.
- **RN25:** La fecha de inicio de una asignación es un compromiso: la tarea trabaja al menos 1 h ese día. Una asignación nueva puede insertarse en la agenda y correr el fin de las siguientes, pero se rechaza si alguna tarea del trabajador, incluida la nueva, queda sin horas en su día de inicio **(decisión)**. Para validarlo se recorre **toda** la agenda, no solo la tarea siguiente: el corrimiento se propaga en cascada hasta que un día con horas libres lo absorbe ([diagrama](../diagramas.md#7-inserción-en-la-agenda)).
- **RN26:** De una asignación solo se guarda la fecha de inicio. Las fechas de fin se calculan recorriendo la agenda del trabajador, así que cambian si cambia el esfuerzo de una tarea o la disponibilidad del trabajador **(decisión)**.

**Ejemplo:** trabajador con 6 h/día.

| Tarea | Esfuerzo | Inicio | Horas por día | Fin |
|-------|----------|--------|---------------|-----|
| A | 10 h | viernes | vie 6 h · lun 4 h | lunes |
| B | 5 h | lunes (después de A) | lun 2 h · mar 3 h | martes |

**Ejemplo de RN25:** trabajador con 6 h/día que ya tiene B (4 h, inicio mar) y C (6 h, inicio mié). Se asigna A con inicio lun.

| A | Horas de A | B | C | Resultado |
|---|------------|---|---|-----------|
| 10 h | lun 6 h · mar 4 h | mar 2 h · mié 2 h | mié 4 h · jue 2 h | Se acepta: B y C conservan su día de inicio y solo cambia su fin |
| 12 h | lun 6 h · mar 6 h | ninguna hora el mar | — | Se rechaza: B pierde su día de inicio |

**Casos borde de RN25** (mismo trabajador de 6 h/día):

| Agenda | Se asigna | Qué pasa | Resultado |
|--------|-----------|----------|-----------|
| B 8 h (mar), C 2 h (mié) | A 10 h (lun) | B trabaja mar 2 h y mié 6 h: conserva su día, pero C ya no tiene horas el mié | Se rechaza: falla una tarea que no es la siguiente |
| B 4 h (jue) | A 10 h (lun) | A termina el mar y quedan libres mar 2 h y mié 6 h | Se acepta: el hueco absorbe el corrimiento y B no cambia |
| X 12 h (vie) | Y 1 h (lun) | X llena vie y lun; Y no puede ir antes porque X no se interrumpe | Se rechaza: el día ya viene lleno desde el viernes |

## 5. Auto-asignación (Req4)

- **RN17:** Asigna de una sola vez todas las tareas `not-done` sin asignar; no reasigna las existentes **(decisión)**.
- **RN18:** Para cada tarea, los candidatos son los trabajadores que cumplen RN6 **(enunciado)**.
- **RN19:** Entre los candidatos, elige al que termina la tarea más pronto, según su agenda actual; la tarea va al final de esa agenda **(decisión)**. El orden de recorrido y el desempate los fijan RN27 y RN28.
- **RN20:** La auto-asignación no programa nada antes del siguiente día hábil después de hoy: mañana, o el lunes si mañana cae en fin de semana. Las tareas de la agenda que terminan antes de esa fecha (incluidas las `done`, RN23) no le quitan horas, y tampoco se usan las horas que sobran de hoy **(decisión)**.
- **RN29:** La agenda del trabajador puede estar ocupada. La fecha de inicio que se guarda es el primer día en que la tarea realmente trabaja horas: la fecha de RN20 si el trabajador tiene horas libres ese día; si no, el día en que termina la última tarea de su agenda, cuando le sobran horas, o el siguiente día hábil. Así la asignación cumple RN25 **(decisión)**.
- **RN21:** Si ningún trabajador cumple las skills, la tarea queda sin asignar y se reporta en el resultado **(decisión)**.
- **RN27:** Las tareas se recorren de la que tiene menos candidatos a la que tiene más (*most-constrained-first*), para que los trabajadores con skills escasas no se llenen de tareas que otros pueden hacer; si empatan, va primero la de menor id **(decisión, provisional: v1)**.
- **RN28:** Si dos candidatos terminan la tarea el mismo día, gana el de menor id **(decisión, provisional: v1)**.

**Ejemplo de RN20 y RN29:** hoy es lun 19, así que la fecha de RN20 es mar 20. "Ana" tiene 6 h/día y se le auto-asigna T (4 h).

| Agenda de Ana | Horas de T | Inicio guardado | Fin |
|---------------|------------|-----------------|-----|
| vacía | mar 4 h | mar 20 | mar 20 |
| P (6 h, vie 16, `done`) | mar 4 h | mar 20 | mar 20 |
| B (4 h, lun 19): hoy le sobran 2 h | mar 4 h | mar 20 | mar 20 |
| B (10 h, mar 20): mar 6 h · mié 4 h | mié 2 h · jue 2 h | mié 21 | jue 22 |
| B (12 h, mar 20): mar 6 h · mié 6 h | jue 4 h | jue 22 | jue 22 |

> RN27 y RN28 son una primera versión del algoritmo. Viven en `task_priority` y `worker_priority` de `app/domain/rules.py`, así que se pueden cambiar sin tocar el resto de `auto_assign`.

## 6. Edición y borrado

- **RN22:** Editar una tarea o un trabajador con asignaciones revalida su agenda: las skills (RN6) y los días de inicio (RN25). Si algo falla, la edición se rechaza indicando qué regla rompe y no se guarda; si pasa, las fechas de fin se recalculan (RN26) **(decisión)**.
- **RN23:** Marcar una tarea como `done` conserva su asignación y sus horas en la agenda **(decisión)**.
- **RN24:** No se puede borrar un trabajador o una tarea que tenga asignaciones; primero hay que eliminarlas (RN30) **(decisión)**.
- **RN30:** Se puede eliminar una asignación, incluso la de una tarea `done`. La tarea vuelve a quedar sin asignar: si es `not-done`, entra en la siguiente auto-asignación (RN17), y como ya no tiene asignaciones se puede borrar (RN24). Las demás tareas del trabajador conservan su inicio y se recalcula su fin (RN26). Quitar horas de la agenda nunca deja a una tarea sin horas en su día de inicio, así que no hace falta revalidar RN25 **(decisión)**.
