// Contrato de drag & drop del planificador.
// Un único DndContext vive en el Planner; las features solo usan estos hooks tipados.

import { useDraggable, useDroppable, type UniqueIdentifier } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';

import { isPendingId } from '@src/api/hooks';
import { isSchedulableDay } from '@src/shared/lib/dates';

/** Lo que se arrastra */
export type DragData =
  | { kind: 'task'; taskId: number } // tarjeta sin asignar
  | { kind: 'assignment'; assignmentId: number; taskId: number; workerId: number };

/** Dónde se suelta */
export type DropData =
  | { kind: 'day'; workerId: number; date: string } // YYYY-MM-DD
  | { kind: 'unassign' };

/** Id único de un draggable: 'task:12' | 'assignment:7' */
export function draggableId(data: DragData): string {
  return data.kind === 'task' ? `task:${data.taskId}` : `assignment:${data.assignmentId}`;
}

/** Id único de un droppable: 'day:3:2026-10-19' | 'unassign' */
export function droppableId(data: DropData): string {
  return data.kind === 'day' ? `day:${data.workerId}:${data.date}` : 'unassign';
}

/** Lee el DragData de un active de dnd-kit (o null si no es nuestro) */
export function readDragData(active: { data: { current?: unknown } } | null | undefined): DragData | null {
  const data = active?.data.current as DragData | undefined;
  return data && (data.kind === 'task' || data.kind === 'assignment') ? data : null;
}

/** Lee el DropData de un over de dnd-kit (o null) */
export function readDropData(over: { data: { current?: unknown } } | null | undefined): DropData | null {
  const data = over?.data.current as DropData | undefined;
  return data && (data.kind === 'day' || data.kind === 'unassign') ? data : null;
}

/**
 * Hace arrastrable una tarjeta o bloque.
 *   const drag = usePlannerDraggable({ kind: 'task', taskId: task.id }, { disabled: task.status === 'done' });
 *   <article ref={drag.setNodeRef} {...drag.attributes} {...drag.listeners} data-dragging={drag.isDragging}>
 * - Mientras se arrastra, el original queda en su lugar (atenuarlo con data-dragging) y el
 *   Planner dibuja la copia en el DragOverlay: NO aplicar `transform` al original.
 * - Las asignaciones optimistas (id < 0) quedan deshabilitadas solas.
 */
export function usePlannerDraggable(data: DragData, options: { disabled?: boolean } = {}) {
  const pending = data.kind === 'assignment' && isPendingId(data.assignmentId);
  return useDraggable({ id: draggableId(data), data, disabled: options.disabled || pending });
}

/**
 * Hace soltable un día de un trabajador o la zona "Desasignar".
 *   const drop = usePlannerDroppable({ kind: 'day', workerId, date });
 *   <div ref={drop.setNodeRef} data-over={drop.isOver} data-droppable={!drop.disabled}>
 * - Un día de fin de semana o pasado queda deshabilitado solo (RN11, RN13): no se resalta ni recibe.
 * - `disabled` extra: p. ej. el trabajador no tiene las skills de lo que se arrastra (mejor solo atenuar
 *   y dejar que la API responda, así el usuario ve el motivo en el toast).
 */
export function usePlannerDroppable(data: DropData, options: { disabled?: boolean } = {}) {
  const invalidDay = data.kind === 'day' && !isSchedulableDay(data.date);
  const disabled = Boolean(options.disabled) || invalidDay;
  const droppable = useDroppable({ id: droppableId(data), data, disabled });
  return { ...droppable, disabled };
}

/** Por si una feature necesita mover el original (no recomendado: usar el DragOverlay) */
export function dragTransformStyle(transform: Parameters<typeof CSS.Translate.toString>[0]): CSSProperties {
  return { transform: CSS.Translate.toString(transform) };
}

export type { UniqueIdentifier };
