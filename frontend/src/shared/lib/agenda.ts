// Horas por día de cada asignación: réplica SOLO VISUAL de backend/app/domain/rules.py
// (`schedule` y `agenda`, RN12–RN16 y RN26). El backend sigue siendo la fuente de verdad:
// fechas de fin y validaciones vienen de la API; esto solo sirve para dibujar.
//
// Recorrido por trabajador:
//   1. Ordenar sus asignaciones por start_date y, si empatan, por id (= orden de asignación, RN15).
//   2. Cada tarea arranca en su start_date (si cae en fin de semana, el lunes siguiente, RN13).
//      Si la anterior termina ese día o después, arranca donde terminó la anterior, usando las
//      horas que sobran de ese día (RN15); si ese día quedó lleno, al siguiente día hábil (RN14).
//   3. Cada día hábil trabaja min(lo que falta, disponibilidad - horas ya usadas) (RN14).
//
// Ejemplo (docs): Ana 6 h/día. A (10 h) desde lun; B (4 h) desde mar.
//   A -> lun 6, mar 4.   B -> mar 2 (lo que sobra), mié 2.   Usadas: lun 6, mar 6, mié 2.

import { addDays, nextBusinessDay, type ISODate } from '@src/shared/lib/dates';

export interface DayHours {
  date: ISODate;
  hours: number;
}

/** Un trozo de tarea en un día: lo que se apila en la columna de ese día */
export interface DaySegment {
  assignmentId: number;
  taskId: number;
  hours: number;
}

export interface DayUsage {
  /** Horas ocupadas ese día (<= disponibilidad) */
  used: number;
  /** Trozos en orden de agenda (de arriba hacia abajo) */
  segments: DaySegment[];
}

export interface WorkerAgenda {
  workerId: number;
  availability: number;
  /** assignmentId -> horas de cada día hábil, en orden (el primero es el inicio real, el último el fin) */
  byAssignment: Map<number, DayHours[]>;
  /** fecha ISO -> uso del día (solo días con horas) */
  byDay: Map<ISODate, DayUsage>;
}

/** Lo mínimo que necesita el cálculo (compatible con Assignment de la API) */
export interface AgendaAssignment {
  id: number;
  task_id: number;
  worker_id: number;
  start_date: ISODate;
}

/** Fechas de una tarea programada: como rules.Schedule */
interface Schedule {
  start: ISODate;
  end: ISODate;
  lastDayHours: number;
  days: DayHours[];
}

/** Réplica de rules.schedule(effort, availability, start, after) */
function schedule(effort: number, availability: number, start: ISODate, after: Schedule | null): Schedule {
  let day = nextBusinessDay(start); // RN13
  let used = 0; // horas ya ocupadas en `day`
  if (after && after.end >= day) {
    // RN15: arranca cuando termina la anterior, con lo que sobra de ese día
    day = after.end;
    used = after.lastDayHours;
  }
  if (used >= availability) {
    // RN14: el día quedó lleno, empieza al siguiente día hábil
    day = nextBusinessDay(addDays(day, 1));
    used = 0;
  }

  const days: DayHours[] = [];
  let remaining = effort;
  // Guardas: esfuerzo/disponibilidad inválidos no deben colgar el navegador
  if (availability <= 0 || effort <= 0) {
    return { start: day, end: day, lastDayHours: used, days };
  }
  for (;;) {
    const hours = Math.min(remaining, availability - used);
    remaining -= hours;
    used += hours;
    if (hours > 0) days.push({ date: day, hours });
    if (remaining <= 0) return { start: days[0]?.date ?? day, end: day, lastDayHours: used, days };
    day = nextBusinessDay(addDays(day, 1));
    used = 0;
  }
}

/**
 * Agenda de UN trabajador.
 * @param assignments sus asignaciones (de cualquier orden; las de otros trabajadores se ignoran)
 * @param effortOf horas totales de la tarea (task.effort). Las tareas done también ocupan (RN23).
 */
export function workerAgenda(
  workerId: number,
  availability: number,
  assignments: readonly AgendaAssignment[],
  effortOf: (taskId: number) => number | undefined,
): WorkerAgenda {
  const own = assignments
    .filter((a) => a.worker_id === workerId)
    .sort((a, b) => (a.start_date === b.start_date ? a.id - b.id : a.start_date < b.start_date ? -1 : 1));

  const byAssignment = new Map<number, DayHours[]>();
  const byDay = new Map<ISODate, DayUsage>();
  let previous: Schedule | null = null;

  for (const assignment of own) {
    const effort = effortOf(assignment.task_id);
    if (effort === undefined) continue; // tarea aún no cargada
    const planned: Schedule = schedule(effort, availability, assignment.start_date, previous);
    previous = planned;
    byAssignment.set(assignment.id, planned.days);
    for (const { date, hours } of planned.days) {
      const usage = byDay.get(date) ?? { used: 0, segments: [] };
      usage.used += hours;
      usage.segments.push({ assignmentId: assignment.id, taskId: assignment.task_id, hours });
      byDay.set(date, usage);
    }
  }
  return { workerId, availability, byAssignment, byDay };
}

/**
 * Agendas de todos los trabajadores: workerId -> WorkerAgenda.
 *   const agendas = buildAgendas(workers, assignments, tasks);
 *   agendas.get(ana.id)?.byDay.get('2026-10-19')?.used
 */
export function buildAgendas(
  workers: readonly { id: number; availability: number }[],
  assignments: readonly AgendaAssignment[],
  tasks: readonly { id: number; effort: number }[],
): Map<number, WorkerAgenda> {
  const effort = new Map(tasks.map((task) => [task.id, task.effort]));
  return new Map(
    workers.map((worker) => [
      worker.id,
      workerAgenda(worker.id, worker.availability, assignments, (taskId) => effort.get(taskId)),
    ]),
  );
}

/** Horas usadas en `date` (0 si no hay nada) */
export function usedHours(agenda: WorkerAgenda | undefined, date: ISODate): number {
  return agenda?.byDay.get(date)?.used ?? 0;
}

/** Ocupación en [0, 1] sobre una lista de días hábiles (horas usadas / horas disponibles) */
export function occupancy(agenda: WorkerAgenda | undefined, days: readonly ISODate[]): number {
  if (!agenda || agenda.availability <= 0 || days.length === 0) return 0;
  const used = days.reduce((sum, day) => sum + usedHours(agenda, day), 0);
  return Math.min(1, used / (agenda.availability * days.length));
}

/** Primer día hábil desde `from` con horas libres ("Libre desde jue 22") */
export function freeFrom(agenda: WorkerAgenda, from: ISODate): ISODate {
  let day = nextBusinessDay(from);
  // Con una agenda finita siempre termina: después del último día ocupado todo está libre
  while (usedHours(agenda, day) >= agenda.availability && agenda.availability > 0) {
    day = nextBusinessDay(addDays(day, 1));
  }
  return day;
}
