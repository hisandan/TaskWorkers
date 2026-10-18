import { CalendarX2, CheckCircle2, Pencil, X } from 'lucide-react';

import { errorMessage } from '@src/api/errors';
import { isPendingId, useUnassign, type Assignment, type Worker } from '@src/api/hooks';
import { t } from '@src/i18n/t';
import { Badge, Button, IconButton, useToast } from '@src/shared/components';
import type { WorkerAgenda } from '@src/shared/lib/agenda';
import { seriesStyle, taskColor } from '@src/shared/lib/colors';
import { formatDayRange } from '@src/shared/lib/dates';
import { useDialogs, usePlanner, usePlannerData } from '@src/features/planner';
import styles from '@src/features/schedule/components/FocusBar.module.css';

/** Barra de la asignación seleccionada en el calendario: detalle + Editar tarea / Desasignar */
export function FocusBar({
  assignment,
  worker,
  agenda,
}: {
  assignment: Assignment;
  worker: Worker;
  agenda: WorkerAgenda | undefined;
}) {
  const { setFocus } = usePlanner();
  const { open } = useDialogs();
  const { taskById } = usePlannerData();
  const unassign = useUnassign();
  const toast = useToast();

  const task = taskById.get(assignment.task_id);
  const name = task?.name ?? t('planner.dnd.unknownTask');
  const days = agenda?.byAssignment.get(assignment.id) ?? [];
  // Fechas dibujadas (agenda.ts); si aún no hay, las de la API
  const from = days[0]?.date ?? assignment.start_date;
  const to = days[days.length - 1]?.date ?? assignment.end_date;
  const pending = isPendingId(assignment.id);

  function onUnassign() {
    setFocus(null);
    unassign.mutate(assignment.id, {
      onSuccess: () => toast.success(t('schedule.focus.unassigned', { task: name })),
      onError: (error) => toast.error(errorMessage(error, { task: name, worker: worker.name })),
    });
  }

  return (
    <section
      className={styles.bar}
      style={seriesStyle(taskColor(assignment.task_id))}
      aria-label={t('schedule.focus.label')}
    >
      <span className={styles.swatch} aria-hidden="true" />
      <div className={styles.info}>
        <p className={styles.name}>{name}</p>
        <p className={styles.meta}>
          {t('schedule.focus.range', { range: formatDayRange(from, to), hours: task?.effort ?? 0 })}
        </p>
      </div>
      {task?.status === 'done' && (
        <Badge tone="success" icon={<CheckCircle2 />}>
          {t('tasks.status.done')}
        </Badge>
      )}
      <div className={styles.actions}>
        {task && (
          <Button size="sm" variant="ghost" icon={<Pencil />} onClick={() => open({ type: 'taskForm', task })}>
            {t('schedule.focus.editTask')}
          </Button>
        )}
        <Button size="sm" variant="secondary" icon={<CalendarX2 />} onClick={onUnassign} disabled={pending}>
          {t('schedule.focus.unassign')}
        </Button>
        <IconButton size="sm" label={t('schedule.focus.clear')} icon={<X />} onClick={() => setFocus(null)} />
      </div>
    </section>
  );
}
