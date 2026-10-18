// Datos del planificador ya cruzados, para no repetir mapas en cada feature.
// Usa las mismas queries que api/hooks.ts (TanStack Query las comparte: una sola petición).

import { useMemo } from 'react';

import {
  useAssignments,
  useTasks,
  useWorkers,
  type Assignment,
  type Task,
  type Worker,
} from '@src/api/hooks';
import { buildAgendas, type WorkerAgenda } from '@src/shared/lib/agenda';

export interface PlannerData {
  tasks: Task[];
  workers: Worker[];
  assignments: Assignment[];
  taskById: Map<number, Task>;
  workerById: Map<number, Worker>;
  assignmentById: Map<number, Assignment>;
  /** Una tarea tiene a lo sumo una asignación (RN9) */
  assignmentByTaskId: Map<number, Assignment>;
  /** workerId -> agenda con horas por día (shared/lib/agenda.ts, solo visual) */
  agendas: Map<number, WorkerAgenda>;
  /** Alguna de las tres listas todavía no llegó */
  isPending: boolean;
  /** Primer error de carga, si hubo */
  error: Error | null;
  refetch: () => void;
}

export function usePlannerData(): PlannerData {
  const tasksQuery = useTasks();
  const workersQuery = useWorkers();
  const assignmentsQuery = useAssignments();

  const tasks = tasksQuery.data;
  const workers = workersQuery.data;
  const assignments = assignmentsQuery.data;

  const derived = useMemo(() => {
    const t = tasks ?? [];
    const w = workers ?? [];
    const a = assignments ?? [];
    return {
      tasks: t,
      workers: w,
      assignments: a,
      taskById: new Map(t.map((task) => [task.id, task])),
      workerById: new Map(w.map((worker) => [worker.id, worker])),
      assignmentById: new Map(a.map((assignment) => [assignment.id, assignment])),
      assignmentByTaskId: new Map(a.map((assignment) => [assignment.task_id, assignment])),
      agendas: buildAgendas(w, a, t),
    };
  }, [tasks, workers, assignments]);

  return {
    ...derived,
    isPending: tasksQuery.isPending || workersQuery.isPending || assignmentsQuery.isPending,
    error: tasksQuery.error ?? workersQuery.error ?? assignmentsQuery.error ?? null,
    refetch: () => {
      void tasksQuery.refetch();
      void workersQuery.refetch();
      void assignmentsQuery.refetch();
    },
  };
}
