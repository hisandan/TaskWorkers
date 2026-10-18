// Tarjeta de una tarea en la columna izquierda.
//
// - Arrastre: el puntero arrastra desde cualquier parte de la tarjeta (los botones internos detienen
//   pointerdown); el teclado, desde el asa (activator de dnd-kit). Así la tarjeta no es un role="button"
//   con botones adentro, y el menú y el badge del trabajador siguen siendo accesibles.
// - Sin asignar -> { kind: 'task' }; en agenda -> { kind: 'assignment' }; terminada -> no se arrastra.

import { CheckCircle2, Circle, Edit3, GripVertical, CalendarPlus, RotateCcw, Trash2, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useId, useRef } from 'react';

import { isPendingId, type Assignment, type Task, type Worker } from '@src/api/hooks';
import { usePlanner, usePlannerDraggable, type DragData } from '@src/features/planner';
import { t } from '@src/i18n/t';
import { Avatar, Badge, Chip, ChipList, Menu, type MenuItem } from '@src/shared/components';
import { seriesStyle, taskColor } from '@src/shared/lib/colors';
import { formatDayRange, type ISODate } from '@src/shared/lib/dates';
import { clearRecentTask } from '@src/features/tasks/lib/recentTask';
import type { TaskActions } from '@src/features/tasks/useTaskActions';
import styles from '@src/features/tasks/components/TaskCard.module.css';

export interface TaskCardProps {
  task: Task;
  /** Su asignación (si está en agenda) y el trabajador */
  assignment?: Assignment;
  worker?: Worker;
  /** Inicio y fin a mostrar (para optimistas, los calcula la agenda visual) */
  range?: { start: ISODate; end: ISODate };
  /** Su asignación es el `focus` del Planner */
  focused?: boolean;
  /** Recién creada o editada: animación de resaltado */
  recent?: boolean;
  actions: TaskActions;
}

export function TaskCard({ task, assignment, worker, range, focused, recent, actions }: TaskCardProps) {
  const { openWorker } = usePlanner();
  const nameId = useId();
  const done = task.status === 'done';
  const pending = assignment ? isPendingId(assignment.id) : false;

  const dragData: DragData = assignment
    ? { kind: 'assignment', assignmentId: assignment.id, taskId: task.id, workerId: assignment.worker_id }
    : { kind: 'task', taskId: task.id };
  const drag = usePlannerDraggable(dragData, { disabled: done });
  const draggable = !done && !pending;

  // Ref propio + el de dnd-kit (para llevar la tarjeta a la vista cuando se resalta)
  const cardRef = useRef<HTMLElement | null>(null);
  const { setNodeRef } = drag;
  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      cardRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

  useEffect(() => {
    if (!focused && !recent) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cardRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [focused, recent]);

  const items: (MenuItem | false)[] = [
    { id: 'edit', label: t('tasks.actions.edit'), icon: <Edit3 />, onSelect: () => actions.edit(task) },
    !assignment &&
      !done && {
        id: 'assign',
        label: t('tasks.actions.assign'),
        icon: <CalendarPlus />,
        onSelect: () => actions.assign(task),
      },
    {
      id: 'status',
      label: done ? t('tasks.actions.markPending') : t('tasks.actions.markDone'),
      icon: done ? <RotateCcw /> : <CheckCircle2 />,
      onSelect: () => actions.toggleDone(task),
    },
    !!assignment && {
      id: 'unassign',
      label: t('tasks.actions.unassign'),
      icon: <Undo2 />,
      disabled: pending,
      onSelect: () => assignment && actions.unassign(task, assignment),
    },
    {
      id: 'delete',
      label: assignment ? t('tasks.actions.deleteBlocked') : t('tasks.actions.delete'),
      icon: <Trash2 />,
      danger: true,
      separated: true,
      // Con asignación la API responde HasAssignments: mejor explicarlo antes
      disabled: Boolean(assignment),
      onSelect: () => actions.remove(task),
    },
  ];

  const rangeText = range ? formatDayRange(range.start, range.end) : '';

  return (
    <article
      ref={setRefs}
      {...drag.listeners}
      aria-labelledby={nameId}
      className={styles.card}
      style={seriesStyle(taskColor(task.id))}
      data-draggable={draggable || undefined}
      data-dragging={drag.isDragging || undefined}
      data-done={done || undefined}
      data-pending={pending || undefined}
      data-focused={focused || undefined}
      data-recent={recent || undefined}
      onAnimationEnd={(event) => {
        if (recent && event.target === event.currentTarget) clearRecentTask(task.id);
      }}
    >
      <div className={styles.header}>
        {draggable ? (
          <button
            type="button"
            ref={drag.setActivatorNodeRef}
            {...drag.attributes}
            aria-roledescription={t('tasks.card.roleDescription')}
            aria-label={t('tasks.card.drag', { name: task.name })}
            className={styles.handle}
          >
            <GripVertical aria-hidden="true" />
          </button>
        ) : (
          <span
            className={styles.handleStatic}
            title={done ? t('tasks.card.notDraggable') : t('tasks.card.pendingSync')}
            aria-hidden="true"
          >
            {done ? <CheckCircle2 /> : <GripVertical />}
          </span>
        )}

        <h3 id={nameId} className={styles.name} title={task.name}>
          {task.name}
        </h3>
        <span className={styles.effort}>{t('tasks.effort', { hours: task.effort })}</span>
        <Menu items={items} label={t('tasks.card.actions', { name: task.name })} />
      </div>

      {task.skills.length > 0 && (
        <ChipList label={t('tasks.card.skills', { name: task.name })} className={styles.skills}>
          {task.skills.map((skill) => (
            <li key={skill}>
              <Chip>{skill}</Chip>
            </li>
          ))}
        </ChipList>
      )}

      <div className={styles.footer}>
        <Badge tone={done ? 'success' : 'neutral'} icon={done ? <CheckCircle2 /> : <Circle />}>
          {t(done ? 'tasks.status.done' : 'tasks.status.not-done')}
        </Badge>

        {assignment && worker && (
          <button
            type="button"
            className={styles.worker}
            disabled={pending}
            aria-label={t('tasks.card.openWorker', { task: task.name, worker: worker.name, range: rangeText })}
            title={worker.name}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onClick={() => openWorker(worker.id, assignment.start_date, assignment.id)}
          >
            <Avatar name={worker.name} id={worker.id} size="sm" />
            <span className={styles.workerName}>{worker.name}</span>
            <span className={styles.range}>{rangeText}</span>
          </button>
        )}
      </div>
    </article>
  );
}
