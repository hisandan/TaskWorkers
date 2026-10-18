// Última tarea creada/editada desde TaskFormDialog, para que TaskBoard la muestre y la resalte.
// El diálogo y la columna no comparten árbol (el Planner monta el diálogo aparte): un store mínimo
// a nivel de módulo, interno de la feature, evita tocar el contrato del Planner.

import { useSyncExternalStore } from 'react';

let recentTaskId: number | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Marca una tarea para resaltar su tarjeta (se limpia sola al terminar la animación) */
export function markRecentTask(id: number) {
  recentTaskId = id;
  emit();
}

export function clearRecentTask(id: number) {
  if (recentTaskId !== id) return;
  recentTaskId = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRecentTaskId(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => recentTaskId,
    () => null,
  );
}
