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
- **RN3:** Una skill se tiene o no se tiene, sin niveles **(decisión)**.

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
- **RN15:** Las tareas de un trabajador se ejecutan una tras otra y de corrido, sin solaparse ni intercalarse; la siguiente tarea usa las horas que sobran del día **(decisión)**.
- **RN16:** La fecha de fin es el último día hábil en que se trabajan horas de la tarea **(decisión)**.

**Ejemplo:** trabajador con 6 h/día.

| Tarea | Esfuerzo | Inicio | Horas por día | Fin |
|-------|----------|--------|---------------|-----|
| A | 10 h | viernes | vie 6 h · lun 4 h | lunes |
| B | 5 h | lunes (después de A) | lun 2 h · mar 3 h | martes |

## 5. Auto-asignación (Req4)

- **RN17:** Asigna de una sola vez todas las tareas `not-done` sin asignar; no reasigna las existentes **(decisión)**.
- **RN18:** Para cada tarea, los candidatos son los trabajadores que cumplen RN6 **(enunciado)**.
- **RN19:** Entre los candidatos, elige al que termina la tarea más pronto, según su agenda actual **(decisión)**.
- **RN20:** La fecha de inicio es el siguiente día hábil a partir de hoy **(decisión)**.
- **RN21:** Si ningún trabajador cumple las skills, la tarea queda sin asignar y se reporta en el resultado **(decisión)**.

## 6. Edición y borrado

- **RN22:** Las skills y el estado se validan solo al momento de asignar; editar después una tarea o un trabajador no revalida ni recalcula lo ya asignado **(decisión)**.
- **RN23:** Marcar una tarea como `done` no recalcula la agenda; la asignación queda como histórico **(decisión)**.
- **RN24:** No se puede borrar un trabajador o una tarea que tenga asignaciones **(decisión)**.
