// Lógica del DndContext del Planner: sensores, qué hacer al soltar y anuncios para lectores.
//
// | Se suelta    | Sobre      | Acción                     |
// | task         | day        | POST /assignments          |
// | assignment   | day        | PUT /assignments/{id}      |
// | assignment   | unassign   | DELETE /assignments/{id}   |
//
// Si la API rechaza: toast de error con errorMessage(error, { task, worker, missing }) y la caché
// vuelve atrás (mutations optimistas de api/hooks.ts).

import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
} from '@dnd-kit/core';
import { useMemo, useState } from 'react';

import { errorMessage, type ErrorContext } from '@src/api/errors';
import { useAssignTask, useMoveAssignment, useUnassign } from '@src/api/hooks';
import { t } from '@src/i18n/t';
import { useToast } from '@src/shared/components/Toaster';
import { formatShortDay, isSchedulableDay } from '@src/shared/lib/dates';
import { formatSkills, missingSkills } from '@src/shared/lib/skills';
import { readDragData, readDropData, type DragData, type DropData } from '@src/features/planner/dnd';
import type { ActiveDrag } from '@src/features/planner/PlannerContext';
import type { PlannerData } from '@src/features/planner/usePlannerData';

export function usePlannerDnd(data: PlannerData) {
  const toast = useToast();
  const assign = useAssignTask();
  const move = useMoveAssignment();
  const unassign = useUnassign();
  const [activeData, setActiveData] = useState<DragData | null>(null);

  const sensors = useSensors(
    // distance: un clic no inicia arrastre (las tarjetas también se pueden clicar)
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const active: ActiveDrag | null = useMemo(() => {
    if (!activeData) return null;
    const assignment =
      activeData.kind === 'assignment' ? data.assignmentById.get(activeData.assignmentId) : undefined;
    return { data: activeData, task: data.taskById.get(activeData.taskId), assignment };
  }, [activeData, data.assignmentById, data.taskById]);

  const taskName = (drag: DragData | null) =>
    (drag && data.taskById.get(drag.taskId)?.name) || t('planner.dnd.unknownTask');

  const targetName = (drop: DropData) =>
    drop.kind === 'unassign'
      ? t('planner.dnd.targetUnassign')
      : t('planner.dnd.targetDay', {
          worker: data.workerById.get(drop.workerId)?.name ?? '',
          date: formatShortDay(drop.date),
        });

  function errorContext(taskId: number, workerId?: number): ErrorContext {
    const task = data.taskById.get(taskId);
    const worker = workerId === undefined ? undefined : data.workerById.get(workerId);
    const missing = task && worker ? formatSkills(missingSkills(task, worker)) : '';
    return { task: task?.name, worker: worker?.name, missing: missing || undefined };
  }

  function onDragStart(event: DragStartEvent) {
    setActiveData(readDragData(event.active));
  }

  function onDragCancel() {
    setActiveData(null);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveData(null);
    const drag = readDragData(event.active);
    const drop = readDropData(event.over);
    if (!drag || !drop) return;

    const name = taskName(drag);

    if (drop.kind === 'day') {
      if (!isSchedulableDay(drop.date)) return;
      const worker = data.workerById.get(drop.workerId)?.name ?? '';
      const ctx = errorContext(drag.taskId, drop.workerId);
      const date = formatShortDay(drop.date);

      if (drag.kind === 'task') {
        assign.mutate(
          { task_id: drag.taskId, worker_id: drop.workerId, start_date: drop.date },
          {
            onSuccess: () => toast.success(t('planner.dnd.assigned', { task: name, worker, date })),
            onError: (error) => toast.error(errorMessage(error, ctx)),
          },
        );
        return;
      }

      const current = data.assignmentById.get(drag.assignmentId);
      if (current && current.worker_id === drop.workerId && current.start_date === drop.date) return;
      move.mutate(
        { id: drag.assignmentId, worker_id: drop.workerId, start_date: drop.date },
        {
          onSuccess: () => toast.success(t('planner.dnd.moved', { task: name, worker, date })),
          onError: (error) => toast.error(errorMessage(error, ctx)),
        },
      );
      return;
    }

    if (drop.kind === 'unassign' && drag.kind === 'assignment') {
      unassign.mutate(drag.assignmentId, {
        onSuccess: () => toast.success(t('planner.dnd.unassigned', { task: name })),
        onError: (error) => toast.error(errorMessage(error, errorContext(drag.taskId, drag.workerId))),
      });
    }
  }

  const announcements: Announcements = {
    onDragStart: ({ active: a }) => t('planner.dnd.pickedUp', { task: taskName(readDragData(a)) }),
    onDragOver: ({ active: a, over }) => {
      const drop = readDropData(over);
      const task = taskName(readDragData(a));
      return drop
        ? t('planner.dnd.over', { task, target: targetName(drop) })
        : t('planner.dnd.notOver', { task });
    },
    onDragEnd: ({ active: a, over }) => {
      const drop = readDropData(over);
      const task = taskName(readDragData(a));
      return drop
        ? t('planner.dnd.dropped', { task, target: targetName(drop) })
        : t('planner.dnd.cancelled', { task });
    },
    onDragCancel: ({ active: a }) => t('planner.dnd.cancelled', { task: taskName(readDragData(a)) }),
  };

  const screenReaderInstructions: ScreenReaderInstructions = { draggable: t('planner.dnd.instructions') };

  return {
    active,
    sensors,
    handlers: { onDragStart, onDragEnd, onDragCancel },
    accessibility: { announcements, screenReaderInstructions },
  };
}
