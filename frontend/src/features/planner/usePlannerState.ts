// Estado de la vista en la URL: ?view=team|table&worker=<id>&week=<lunes>&focus=<assignmentId>
// pushState al navegar (Atrás/Adelante funcionan) y popstate para escuchar.
// useSyncExternalStore: en el servidor (client:load hace SSR) se usa el estado por defecto y,
// al hidratar, React vuelve a renderizar con la URL real sin errores de hidratación.

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { addWeeks, currentWeek, isISODate, mondayOf, type ISODate } from '@src/shared/lib/dates';

export type PlannerView = 'team' | 'table';

/** Semanas que muestra la vista Equipo desde `week` */
export const TEAM_WEEKS = 3;

/** Semanas que muestra el calendario de un trabajador desde `week` */
export const CALENDAR_WEEKS = 2;

export interface PlannerUrlState {
  /** team: Equipo (o calendario si hay `workerId`) · table: tabla de Asignaciones */
  view: PlannerView;
  /** Trabajador cuyo calendario está abierto (null = filas de Equipo) */
  workerId: number | null;
  /** Lunes de la primera semana visible */
  week: ISODate;
  /** Asignación resaltada (desde el badge de una tarjeta o un clic en un bloque) */
  focus: number | null;
}

export interface PlannerActions {
  setView: (view: PlannerView) => void;
  /** Cualquier día: se normaliza a su lunes */
  setWeek: (date: ISODate) => void;
  /** Suma semanas a `week` (◀ -1 / ▶ +1) */
  shiftWeeks: (weeks: number) => void;
  /** Vuelve a la semana actual */
  goToday: () => void;
  /** Abre el calendario de un trabajador; con `date` salta a esa semana; con `assignmentId` la resalta */
  openWorker: (workerId: number, date?: ISODate, assignmentId?: number) => void;
  /** Cierra el calendario (vuelve a Equipo) */
  closeWorker: () => void;
  /** Resalta una asignación sin agregar entrada al historial (null quita el resalte) */
  setFocus: (assignmentId: number | null) => void;
}

const NAVIGATE_EVENT = 'planner:navigate';

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  window.addEventListener(NAVIGATE_EVENT, callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener(NAVIGATE_EVENT, callback);
  };
}

const getSnapshot = () => window.location.search;
const getServerSnapshot = () => '';

function positiveInt(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function parsePlannerSearch(search: string): PlannerUrlState {
  const params = new URLSearchParams(search);
  const week = params.get('week');
  return {
    view: params.get('view') === 'table' ? 'table' : 'team',
    workerId: positiveInt(params.get('worker')),
    week: isISODate(week) ? mondayOf(week) : currentWeek(),
    focus: positiveInt(params.get('focus')),
  };
}

export function serializePlannerState(state: PlannerUrlState): string {
  const params = new URLSearchParams();
  if (state.view !== 'team') params.set('view', state.view);
  if (state.workerId !== null) params.set('worker', String(state.workerId));
  if (state.week !== currentWeek()) params.set('week', state.week);
  if (state.focus !== null) params.set('focus', String(state.focus));
  const query = params.toString();
  return query ? `?${query}` : '';
}

function navigate(next: PlannerUrlState, replace = false) {
  const url = `${window.location.pathname}${serializePlannerState(next)}${window.location.hash}`;
  if (url === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
  if (replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

export function usePlannerState(): PlannerUrlState & PlannerActions {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const state = useMemo(() => parsePlannerSearch(search), [search]);

  // Las acciones leen la URL actual (no el render) para no pisar cambios encadenados
  const current = () => parsePlannerSearch(window.location.search);

  // Cambiar de pestaña cierra el calendario: "Equipo" vuelve siempre a la vista de todo el equipo
  const setView = useCallback(
    (view: PlannerView) => navigate({ ...current(), view, workerId: null, focus: null }),
    [],
  );
  const setWeek = useCallback((date: ISODate) => navigate({ ...current(), week: mondayOf(date) }), []);
  const shiftWeeks = useCallback((weeks: number) => {
    const now = current();
    navigate({ ...now, week: addWeeks(now.week, weeks) });
  }, []);
  const goToday = useCallback(() => navigate({ ...current(), week: currentWeek() }), []);
  const openWorker = useCallback((workerId: number, date?: ISODate, assignmentId?: number) => {
    const now = current();
    navigate({
      view: 'team',
      workerId,
      week: date ? mondayOf(date) : now.week,
      focus: assignmentId ?? null,
    });
  }, []);
  const closeWorker = useCallback(() => navigate({ ...current(), workerId: null, focus: null }), []);
  const setFocus = useCallback(
    (assignmentId: number | null) => navigate({ ...current(), focus: assignmentId }, true),
    [],
  );

  return { ...state, setView, setWeek, shiftWeeks, goToday, openWorker, closeWorker, setFocus };
}
