[← Volver a Diseño UI](diseno-ui.md)

# Planificador (frontend)

Una sola página (`/`) donde se ven las tareas, los trabajadores y su agenda, y donde se crea, asigna, mueve y desasigna todo. Respeta el [sistema de diseño](diseno-ui.md): solo tokens, solo textos de `i18n/es.ts`, ambos modos.

## Herramientas

| Necesidad | Elegido | Por qué |
|---|---|---|
| Datos | `openapi-fetch` + `openapi-react-query` + TanStack Query (ya estaban) | Tipos generados desde el backend (`make api-client`) |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/utilities` | Accesible (teclado), funciona entre la columna de tareas y el calendario |
| Fechas | `date-fns` (+ locale `es`) | Días hábiles, semanas, formato |
| Iconos | `lucide-react` | Livianos, consistentes; siempre `aria-hidden` con texto al lado |
| Diálogos | `<dialog>` nativo | Foco atrapado y `Esc` gratis, sin dependencias |
| Estilos | CSS Modules (`*.module.css`) con tokens | Sin Tailwind: el proyecto ya define sus tokens (`AGENTS.md`) |
| Toasts | Propio (`shared/components/Toaster`) con `role="alert"` | Errores visibles y accesibles, también para el e2e |

## Layout

```
┌ Header: TaskWorkers                                              [tema] ┐
├ Toolbar: [+ Nueva tarea] [+ Nuevo trabajador] [Asignar tarea] [⚡ Auto-asignar] ┤
├──────── 1/4 ─────────┬──────────────────── 3/4 ──────────────────────────┤
│ TaskBoard            │ [Equipo] [Asignaciones]          [◀ Hoy ▶] semana │
│ (Por asignar|En agenda)│                                                  │
│ buscar · skill       │ Equipo: filas trabajador × días hábiles (3 sem)   │
│ tarjetas arrastrables│   o, con un trabajador elegido, su calendario     │
│ zona "Desasignar"    │ Asignaciones: tabla                              │
└──────────────────────┴───────────────────────────────────────────────────┘
```

- Ancho completo (no `--size-content`). En pantallas angostas (< 900px) las columnas se apilan.
- Estado de la vista en la URL: `?view=team|table&worker=<id>&week=<YYYY-MM-DD lunes>&focus=<assignmentId>`. Atrás/adelante funcionan.

## Columna de tareas (`features/tasks`)

- Pestañas **Por asignar (n)** / **En agenda (n)**. Listas con `aria-label` "Tareas por asignar" / "Tareas en agenda" (no usar "Sin asignar", "Asignadas" ni "Asignaciones": son nombres del e2e).
- Buscador por nombre y filtro por skill.
- Tarjeta: nombre, esfuerzo (`10 h`), skills como chips, estado (`Pendiente` / `Terminada`, con icono).
  - En agenda: badge del trabajador (avatar con iniciales y su color) + `lun 19 → mar 20`. Clic en el badge abre su calendario en esa semana con la asignación resaltada.
  - Menú: Editar, Marcar terminada / pendiente, Desasignar (si tiene), Eliminar.
- Arrastrables: tareas `not-done` (sin asignar → asignar; en agenda → mover). `done` no se arrastran.
- Mientras se arrastra una asignación aparece la zona **Desasignar** al pie de la columna.

## Panel derecho (`features/schedule`)

**Equipo** (por defecto): una fila por trabajador, columnas = días hábiles de 3 semanas desde `week`.
- Encabezado de fila: avatar, nombre, `6 h/día`, skills, % de ocupación en el rango, "Libre desde jue 22". Menú: Editar, Eliminar.
- Celda: barra de ocupación (horas usadas / disponibilidad) con los colores de las tareas; hoy marcado; días pasados atenuados.
- Clic en la fila → calendario de ese trabajador.

**Calendario de un trabajador**: semana(s) de lunes a domingo; sábado y domingo angostos, rayados y sin drop (RN13).
- Cada día es una columna de capacidad (= disponibilidad); las tareas se apilan con alto proporcional a sus horas ese día y conservan el color entre días.
- Bloques arrastrables (mover / desasignar), clic → resalta y muestra acciones.
- Botón ✕ vuelve a Equipo.

**Asignaciones**: tabla con `aria-label="Asignaciones"`: Tarea, Trabajador, Inicio, Fin (`YYYY-MM-DD`), acción Desasignar.

### Horas por día (solo para dibujar)

La API devuelve inicio y fin de cada asignación, no las horas de cada día. `shared/lib/agenda.ts` replica el recorrido del dominio (RN12–RN16, `rules.agenda`): ordena por inicio y luego por id, y cada tarea usa lo que sobra del día de la anterior. Es **solo visual**: el backend sigue siendo la fuente de verdad (fechas de fin y validaciones).

## Drag & drop (contrato)

Un único `DndContext` en el `Planner`. Tipos en `features/planner/dnd.ts`:

```ts
type DragData =
  | { kind: 'task'; taskId: number }                          // tarjeta sin asignar
  | { kind: 'assignment'; assignmentId: number; taskId: number; workerId: number };
type DropData =
  | { kind: 'day'; workerId: number; date: string }            // YYYY-MM-DD
  | { kind: 'unassign' };
```

| Se suelta | Sobre | Acción |
|---|---|---|
| `task` | `day` | `POST /assignments` |
| `assignment` | `day` | `PUT /assignments/{id}` |
| `assignment` | `unassign` | `DELETE /assignments/{id}` |

- Mientras se arrastra: los trabajadores sin las skills se atenúan con "Falta: sql"; días pasados y fines de semana no se resaltan como destino.
- Si la API rechaza: toast de error y no cambia nada (la caché se invalida igual).

## Diálogos (`<dialog>`, formularios con `aria-label`)

| Diálogo | `aria-label` del form | Campos (label) | Botón |
|---|---|---|---|
| Nueva tarea / Editar tarea | "Nueva tarea" / "Editar tarea" | Nombre, Esfuerzo, Skills (separadas por coma), Estado (solo editar) | Crear / Guardar |
| Nuevo trabajador / Editar trabajador | "Nuevo trabajador" / "Editar trabajador" | Nombre, Disponibilidad (h/día), Skills (separadas por coma) | Crear / Guardar |
| Asignar tarea | "Asignar tarea" | Tarea (`<select>` de pendientes), Trabajador (`<select>`), Inicio (`<input type=date>`) | Asignar |
| Resultado de auto-asignar | — | Listas `aria-label` "Asignadas" y "Sin asignar" (con motivo: "Nadie tiene: rust") | Cerrar |
| Confirmar eliminar | — | — | Eliminar |

Errores de la API dentro del diálogo en un `<p role="alert">`; fuera de diálogos, toast con `role="alert"`.

## Errores

La API responde `{ detail, code }` (`code` = nombre del error de dominio). `api/errors.ts` lo convierte a un mensaje de `i18n` (`errors.MissingSkills`, ...). Los 422 de validación de Pydantic traen `detail` como lista: se muestra un mensaje genérico de datos inválidos.

## Colores de trabajador y tarea

`--color-series-1` … `--color-series-8` (con su `-soft`) en `theme.css`, claro y oscuro. Trabajador: `series[(id - 1) % 8]`. Bloques de tarea en el calendario: `series[(taskId - 1) % 8]`.

## Contratos de implementación

Base compartida lista (tokens, `api/`, `shared/`, `features/planner`). Cada feature reemplaza **solo** sus placeholders y agrega textos **solo** en su namespace de `i18n/es.ts` (`tasks.*`, `schedule.*`, `workers.*`, `assignments.*`). No editar `features/planner`, `shared/` ni `api/` sin acordarlo: son el contrato.

### Imports

| Desde | Importar | Nota |
|---|---|---|
| Página | `import { Planner } from '@src/features/planner/root'` | Única excepción a "solo index.ts": `root.ts` importa a las features y el `index.ts` no, así no hay ciclos |
| Features | `@src/features/planner` (index) | Contexto, DnD, datos cruzados. **Nunca** `Planner.tsx` |
| Features | `@src/api/hooks`, `@src/api/errors` | Datos, mutations y mensajes de error |
| Features | `@src/shared/components`, `@src/shared/lib/*`, `@src/shared/hooks/*` | UI y utilidades |
| Feature → otra feature | Prohibido | Lo que se comparte va por el Planner (slots y diálogos) |

### Exports que debe tener cada feature (props exactas)

| Feature | Export | Props | Dónde lo monta el Planner |
|---|---|---|---|
| `tasks` | `TaskBoard` | ninguna (lee `usePlannerData()` / `usePlanner()`) | Columna izquierda (`<section aria-label="Tareas">`, con scroll propio y sticky) |
| `tasks` | `TaskFormDialog` | `{ task?: Task; onClose: () => void }` | `dialog.type === 'taskForm'` |
| `schedule` | `ScheduleView` | ninguna | Panel derecho cuando `view === 'team'` (filas de Equipo o, si `workerId !== null`, el calendario de ese trabajador con su botón ✕ → `closeWorker()`) |
| `workers` | `WorkerFormDialog` | `{ worker?: Worker; onClose: () => void }` | `dialog.type === 'workerForm'` |
| `assignments` | `AssignTaskDialog` | `{ taskId?: number; workerId?: number; date?: string; onClose: () => void }` (valores iniciales) | `dialog.type === 'assign'` |
| `assignments` | `AutoAssignResultDialog` | `{ result: AutoAssignResult; onClose: () => void }` | `dialog.type === 'autoAssignResult'` |
| `assignments` | `AssignmentsTable` | ninguna | Panel derecho cuando `view === 'table'` (`<table aria-label="Asignaciones">`) |

El Planner ya pinta: la toolbar (Nueva tarea, Nuevo trabajador, Asignar tarea, Auto-asignar), las pestañas **Equipo / Asignaciones** del panel derecho (`role="tablist"`, el panel es `role="tabpanel"`) y la navegación de semanas `[◀] [Hoy] [▶] 19 oct – 6 nov` (solo en Equipo). `ScheduleView` no repite ninguna de esas cosas.

### Diálogos (`useDialogs()`)

Uno a la vez. El Planner guarda `dialog: DialogState | null` y **monta** el componente de la feature mientras está abierto (se desmonta al cerrar: el formulario arranca limpio).

```ts
type DialogState =
  | { type: 'taskForm'; task?: Task }
  | { type: 'workerForm'; worker?: Worker }
  | { type: 'assign'; taskId?: number; workerId?: number; date?: string }
  | { type: 'autoAssignResult'; result: AutoAssignResult }
  | { type: 'confirm'; title; message; confirmLabel?; tone?; onConfirm; errorContext? };

const { open, close, confirm } = useDialogs();
open({ type: 'taskForm', task });                       // Editar tarea
confirm({ title, message, onConfirm: () => deleteTask.mutateAsync(task.id), errorContext: { name: task.name } });
```

- Un diálogo de feature renderiza `<Dialog open title=... onClose={onClose}>` (de `shared`) y adentro su `<form aria-label="Nueva tarea">` con `<Field label="Nombre"><Input /></Field>`, etc. Botones con `<DialogFooter>` dentro del form. Al terminar bien: `onClose()`.
- Errores de la API **dentro** del diálogo con `<FormError message={errorMessage(err, ctx)} />` (`<p role="alert">`). Dentro de un diálogo **no** se usan toasts: el e2e espera un solo `role="alert"` visible.
- Foco inicial: el primer campo, o el elemento con `data-autofocus` (React no escribe `autofocus`).
- `ConfirmDialog` ya muestra el error de `onConfirm` si lanza (usar `mutateAsync`).
- Auto-asignar: el **Planner** llama a `POST /assignments/auto` y abre `autoAssignResult` con la respuesta; si falla, toast. `AutoAssignResultDialog` solo muestra las listas `aria-label` "Asignadas" y "Sin asignar" (motivo con `missingSkills`/skills sin dueño).

### Estado de la vista (`usePlanner()`)

`{ view, workerId, week, focus }` (en la URL, Atrás/Adelante funcionan) + acciones:

| Acción | Efecto |
|---|---|
| `setView('team' \| 'table')` | Cambia de pestaña (limpia `focus`) |
| `setWeek(date)` / `shiftWeeks(n)` / `goToday()` | `week` = lunes de la primera semana visible. Equipo muestra `TEAM_WEEKS` (3) semanas |
| `openWorker(workerId, date?, assignmentId?)` | Abre el calendario del trabajador (vista team); con `date` salta a esa semana; con `assignmentId` la resalta (`focus`). Lo usa el badge de una tarjeta "En agenda" |
| `closeWorker()` | Vuelve a las filas de Equipo |
| `setFocus(id \| null)` | Resalta una asignación sin agregar historial |

### Datos

- `usePlannerData()` → `{ tasks, workers, assignments, taskById, workerById, assignmentById, assignmentByTaskId, agendas, isPending, error, refetch }`. Las tres queries se comparten (una petición cada una).
- `agendas.get(workerId)` (`shared/lib/agenda.ts`, solo visual): `byAssignment.get(id)` → `{ date, hours }[]`; `byDay.get(date)` → `{ used, segments: [{ assignmentId, taskId, hours }] }` en orden de apilado. Helpers: `usedHours`, `occupancy(agenda, days)`, `freeFrom(agenda, today())`.
- Mutations (`api/hooks.ts`): `useCreateTask`, `useUpdateTask`, `useDeleteTask`, `useCreateWorker`, `useUpdateWorker`, `useDeleteWorker`, `useAssignTask`, `useMoveAssignment`, `useUnassign`, `useAutoAssign`. Todas lanzan `ApiError` e invalidan lo que corresponde. Asignar/mover/desasignar son **optimistas** (id negativo mientras tanto: `isPendingId(id)`; no arrastrables).
- Mensajes: `errorMessage(error, { task?, worker?, name?, missing? })` → usa la variante más concreta de `errors.detailed|named|codes.<code>` cuyos datos estén todos; 422 de Pydantic → `errors.validation`; red → `errors.network`.
- Fechas: siempre ISO local con `shared/lib/dates.ts` (`today`, `isSchedulableDay`, `businessDaysOfWeeks(week, 3)`, `formatShortDay` → `lun 19`, `formatDayRange` → `lun 19 → mar 20`). Nunca `toISOString()` ni `new Date('YYYY-MM-DD')`.
- Colores: `seriesStyle(workerColor(id))` / `seriesStyle(taskColor(taskId))` en `style` y en el CSS `var(--series)` / `var(--series-soft)`.
- Skills: `parseSkills('python, sql')`, `formatSkills`, `missingSkills(task, worker)`, `canTake`, `allSkills`.

### Drag & drop

Un solo `DndContext` en el Planner (sensores puntero con 5 px de umbral + teclado, anuncios en español, `DragOverlay` con la tarjeta flotante). Las features **no** crean otro `DndContext`.

```tsx
import { usePlannerDraggable, usePlannerDroppable, useActiveDrag } from '@src/features/planner';

// Tarjeta sin asignar (tasks) / bloque de calendario (schedule) / tarjeta En agenda (tasks)
const drag = usePlannerDraggable({ kind: 'task', taskId: task.id }, { disabled: task.status === 'done' });
const drag = usePlannerDraggable({ kind: 'assignment', assignmentId: a.id, taskId: a.task_id, workerId: a.worker_id });
<article ref={drag.setNodeRef} {...drag.attributes} {...drag.listeners} data-dragging={drag.isDragging || undefined}>

// Celda de un día (schedule: fila de Equipo o columna del calendario)
const drop = usePlannerDroppable({ kind: 'day', workerId: worker.id, date });
<div ref={drop.setNodeRef} data-over={drop.isOver || undefined} data-disabled={drop.disabled || undefined}>

// Zona Desasignar (tasks, al pie de la columna, solo mientras active?.data.kind === 'assignment')
const drop = usePlannerDroppable({ kind: 'unassign' });

// Qué se arrastra ahora (para atenuar trabajadores y mostrar "Falta: sql")
const active = useActiveDrag();            // { data: DragData, task?: Task, assignment?: Assignment } | null
const missing = active?.task ? missingSkills(active.task, worker) : [];
```

- **No** aplicar `transform` al original: queda en su lugar atenuado (`data-dragging`) y el Planner dibuja la copia en el overlay.
- Los días de fin de semana y pasados quedan `disabled` solos (`drop.disabled`): no resaltar ni recibir. A los trabajadores sin skills **no** deshabilitarlos: solo atenuarlos; si se suelta, la API responde y el toast explica el motivo.
- Al soltar, `usePlannerDnd` hace POST / PUT / DELETE, muestra el toast (éxito `role="status"`, error `role="alert"` con nombres) y no hace nada si el destino es el mismo día y trabajador.
- Mientras se arrastra, el contenedor del Planner tiene `data-dragging="task" | "assignment"` por si hace falta estilo global.
- Botones dentro de un elemento arrastrable: `Menu` ya detiene `pointerdown`/`keydown`; para otros botones, `onPointerDown={(e) => e.stopPropagation()}`.

### Componentes compartidos (`@src/shared/components`)

`Button` (primary/secondary/ghost/danger, `size` md = 44 px / sm = 32 px, `icon`, `loading`), `IconButton` (`label` obligatorio), `Dialog` + `DialogFooter`, `ConfirmDialog`, `Field` + `Input` / `Select` / `Textarea`, `FormError`, `FormStack`, `FormRow`, `Badge` (tono + icono + texto), `Chip` + `ChipList` (skills; `tone="missing"`), `Avatar` (iniciales + color de serie), `Tabs` / `Segmented` + `tabPanelProps`, `Menu` (botón ⋯, popover nativo), `ToastProvider` + `useToast()` (`success` / `error` / `info`), `EmptyState`, `Spinner`, `Skeleton`. `useIsClient()` en `shared/hooks`.

### Tokens del planificador

`--color-series-1..8` y `-soft`, `--color-weekend-stripe`, `--color-today` / `-soft`, `--color-drop-target` / `-border`, `--color-capacity-track`, `--color-row-hover`, `--color-backdrop`; tamaños `--size-planner-sidebar | row-header | row | day | weekend | hour`, `--size-control-sm`, `--size-avatar(-sm)`, `--size-icon(-sm)`, `--size-app-header`; `--duration-slow`, `--ease-emphasized`, `--z-drag`, `--space-5`.

### Pendiente con el e2e

`e2e/tests/demo.spec.ts` busca los formularios "Nuevo trabajador", "Nueva tarea" y "Asignar tarea" y la tabla "Asignaciones" **sin** abrir antes un diálogo ni cambiar de pestaña. Con diálogos y la vista Equipo por defecto, el e2e debe hacer clic en el botón de la toolbar (y en la pestaña Asignaciones) antes de llenar o leer; o la UI debe cambiar. Hay que decidirlo antes de cerrar la demo.
