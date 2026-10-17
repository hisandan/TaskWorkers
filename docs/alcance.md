# Definición de Alcance (Requerimientos)

**Objetivo:** me enfoqué en entender el problema y en eliminar ambigüedades sobre lo que se espera de la solución, partiendo de los requerimientos dados.

## Índice

1. [Enfoque de la Prueba Técnica](#1-enfoque-de-la-prueba-técnica)
2. [Requerimientos](#2-requerimientos)
3. [Supuestos de Negocio](#3-supuestos-de-negocio)
4. [Exposición](#4-exposición)
5. [Reglas de negocio](#5-reglas-de-negocio)

---

## 1. Enfoque de la Prueba Técnica

El enfoque fue construir una **prueba de concepto (PoC)** que pueda exponer a profundidad en poco tiempo. Me tomé esta libertad porque el enunciado no especifica el nivel de profundidad al que debe llegar la solución aparte de los requerimientos base y lo deja abierto, y me siento más seguro exponiendo pocas cosas que entienda bien que una solución robusta desarrollada en poco tiempo. Por eso el enfoque **no** fue construir una aplicación robusta con trazabilidad, login, CI/CD, manuales de apoyo exhaustivos, etc...

## 2. Requerimientos

Tomados del [enunciado](../README.md#1-enunciado):

- **Req1:** CRUD de tareas: nombre, esfuerzo (horas), skills, estado (`done` / `not-done`).
- **Req2:** CRUD de trabajadores: nombre, disponibilidad (horas/día), skills.
- **Req3:** Asignación manual de tareas a trabajadores (trabajador, tareas, fecha de inicio).
- **Req3a:** La asignación solo se permite si las skills de la tarea son un subconjunto de las del trabajador.
- **Req4:** Auto-asignación de tareas.

## 3. Supuestos de Negocio
Me parece relevante aclarar para partir de una definición del negocio más clara y eliminar ambiguedades con el fin de identificar posibles puntos de fricción con las necesidades del negocio lo más antes posible. (esto no incluye los casos edge que serán desarrollados en la parte de testing).

- No hay autenticación ni roles: un solo usuario administra todo.
- La disponibilidad del trabajador es la misma todos los días hábiles. Esto implica que no habrá distinción de que horas en específico dentro del día habil tiene disponible un trabajador.
- No hay festivos ni vacaciones; solo se trabaja de lunes a viernes.
- Una tarea se asigna a un solo trabajador, es decir no puede comenzar un trabajador la tarea dejarla a la mitad y continuar otro.
- Si una tarea dura más de el tiempo disponible de un trabajador en el día puede continuarla al inicio de las horas disponibles en el siguiente día. Sin embargo las tareas deben realizarse de corrido (No trabajar en parte de la tarea A el siguiente día cambiar a la tarea B y  el siguiente volver a lo que faltó de la A). 
- Las tareas de un trabajador se ejecutan una tras otra, sin solaparse.
- La auto-asignación solo toma tareas sin asignar.
- Una skill se tiene o no se tiene (sin niveles).
- El esfuerzo de una tarea está definido en horas enteras.

## 4. Exposición

Para demostrar un perfil más integral en la prueba técnica y facilitar la demo, se definió construir una interfaz web que se comunique con la aplicación mediante una API REST, la cual expone las operaciones disponibles (incluyendo los CRUD).

## 5. Reglas de negocio

Ver en [Reglas de Negocio](alcance/negocio.md).
