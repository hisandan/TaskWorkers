// Contextos del planificador: estado de la vista (URL), diálogos y lo que se está arrastrando.
// Los provee <Planner>; las features los leen con usePlanner(), useDialogs() y useActiveDrag().

import { createContext, useContext } from 'react';

import type { Assignment, AutoAssignResult, Task, Worker } from '@src/api/hooks';
import type { ConfirmDialogProps } from '@src/shared/components/ConfirmDialog';
import type { DragData } from '@src/features/planner/dnd';
import type { PlannerActions, PlannerUrlState } from '@src/features/planner/usePlannerState';

// ---------------------------------------------------------------------------
// Diálogos: uno a la vez. El Planner monta el componente de la feature que corresponda.
// ---------------------------------------------------------------------------

export type DialogState =
  /** features/tasks -> <TaskFormDialog task? /> (sin task = "Nueva tarea") */
  | { type: 'taskForm'; task?: Task }
  /** features/workers -> <WorkerFormDialog worker? /> (sin worker = "Nuevo trabajador") */
  | { type: 'workerForm'; worker?: Worker }
  /** features/assignments -> <AssignTaskDialog taskId? workerId? date? /> (valores iniciales) */
  | { type: 'assign'; taskId?: number; workerId?: number; date?: string }
  /** features/assignments -> <AutoAssignResultDialog result /> (el Planner ya llamó a la API) */
  | { type: 'autoAssignResult'; result: AutoAssignResult }
  /** shared -> <ConfirmDialog /> (eliminar tarea / trabajador, etc.) */
  | ({ type: 'confirm' } & Omit<ConfirmDialogProps, 'onClose'>);

export type DialogType = DialogState['type'];

export interface DialogsApi {
  /** Diálogo abierto (null = ninguno) */
  dialog: DialogState | null;
  open: (dialog: DialogState) => void;
  close: () => void;
  /** Atajo de open({ type: 'confirm', ... }) */
  confirm: (options: Omit<ConfirmDialogProps, 'onClose'>) => void;
}

// ---------------------------------------------------------------------------
// Estado + acciones + diálogos
// ---------------------------------------------------------------------------

export interface PlannerContextValue extends PlannerUrlState, PlannerActions {
  dialogs: DialogsApi;
}

export const PlannerContext = createContext<PlannerContextValue | null>(null);

/** Estado de la vista (view, workerId, week, focus) y acciones (openWorker, setWeek, ...) */
export function usePlanner(): PlannerContextValue {
  const value = useContext(PlannerContext);
  if (!value) throw new Error('usePlanner() necesita estar dentro de <Planner>');
  return value;
}

/** Abrir y cerrar diálogos: const { open } = useDialogs(); open({ type: 'taskForm', task }) */
export function useDialogs(): DialogsApi {
  return usePlanner().dialogs;
}

// ---------------------------------------------------------------------------
// Arrastre en curso
// ---------------------------------------------------------------------------

export interface ActiveDrag {
  data: DragData;
  /** Tarea que se arrastra (para skills: atenuar trabajadores con missingSkills(task, worker)) */
  task: Task | undefined;
  /** Solo si data.kind === 'assignment' */
  assignment: Assignment | undefined;
}

export const ActiveDragContext = createContext<ActiveDrag | null>(null);

/** Lo que se está arrastrando ahora (null si nada). Re-renderiza solo al empezar y terminar. */
export function useActiveDrag(): ActiveDrag | null {
  return useContext(ActiveDragContext);
}
