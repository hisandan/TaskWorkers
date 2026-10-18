// Panel derecho, vista Asignaciones: <table aria-label="Asignaciones"> (contrato del e2e).
// Inicio y Fin muestran la fecha ISO (YYYY-MM-DD) seguida del día corto: "2026-10-19 · lun 19".
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, CheckCircle2, Table2, Undo2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { errorMessage } from '@src/api/errors';
import { isPendingId, useUnassign, type Assignment } from '@src/api/hooks';
import { usePlanner, usePlannerData } from '@src/features/planner';
import { t, type MessageKey } from '@src/i18n/t';
import { Avatar, Badge, EmptyState, IconButton, Skeleton, useToast } from '@src/shared/components';
import { seriesStyle, taskColor } from '@src/shared/lib/colors';
import { cx } from '@src/shared/lib/cx';
import { formatShortDay } from '@src/shared/lib/dates';
import styles from '@src/features/assignments/components/AssignmentsTable.module.css';

type SortKey = 'task' | 'worker' | 'start' | 'end' | 'effort';
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: MessageKey; numeric?: boolean }[] = [
  { key: 'task', label: 'assignments.table.task' },
  { key: 'worker', label: 'assignments.table.worker' },
  { key: 'start', label: 'assignments.table.start' },
  { key: 'end', label: 'assignments.table.end' },
  { key: 'effort', label: 'assignments.table.effort', numeric: true },
];

interface Row {
  assignment: Assignment;
  taskName: string;
  workerName: string;
  effort: number;
  done: boolean;
}

function compare(a: Row, b: Row, key: SortKey): number {
  switch (key) {
    case 'task':
      return a.taskName.localeCompare(b.taskName, 'es');
    case 'worker':
      return a.workerName.localeCompare(b.workerName, 'es');
    case 'start':
      return a.assignment.start_date.localeCompare(b.assignment.start_date);
    case 'end':
      return a.assignment.end_date.localeCompare(b.assignment.end_date);
    case 'effort':
      return a.effort - b.effort;
  }
}

function DateCell({ iso }: { iso: string }) {
  return (
    <span className={styles.date}>{t('assignments.table.date', { iso, day: formatShortDay(iso) })}</span>
  );
}

export function AssignmentsTable() {
  const toast = useToast();
  const { openWorker, focus } = usePlanner();
  const { assignments, taskById, workerById, isPending } = usePlannerData();
  const unassign = useUnassign();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'start', dir: 'asc' });

  const rows = useMemo(() => {
    const list: Row[] = assignments.map((assignment) => {
      const task = taskById.get(assignment.task_id);
      return {
        assignment,
        taskName: task?.name ?? t('common.none'),
        workerName: workerById.get(assignment.worker_id)?.name ?? t('common.none'),
        effort: task?.effort ?? 0,
        done: task?.status === 'done',
      };
    });
    const sign = sort.dir === 'asc' ? 1 : -1;
    // Desempate estable: inicio y luego id (el mismo orden que la agenda)
    return list.sort(
      (a, b) =>
        sign * compare(a, b, sort.key) ||
        a.assignment.start_date.localeCompare(b.assignment.start_date) ||
        a.assignment.id - b.assignment.id,
    );
  }, [assignments, taskById, workerById, sort]);

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );
  }

  function onUnassign(row: Row) {
    unassign.mutate(row.assignment.id, {
      onSuccess: () => toast.success(t('assignments.toast.unassigned', { task: row.taskName })),
      onError: (error) => toast.error(errorMessage(error, { task: row.taskName, worker: row.workerName })),
    });
  }

  if (isPending && assignments.length === 0) {
    return (
      <div className={styles.loading} aria-busy="true" aria-label={t('assignments.table.loading')}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height="var(--size-touch)" radius="sm" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Table2 />}
        title={t('assignments.table.emptyTitle')}
        description={t('assignments.table.emptyDescription')}
      />
    );
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table} aria-label={t('assignments.table.label')}>
        <thead>
          <tr>
            {COLUMNS.map((column) => {
              const active = sort.key === column.key;
              const SortIcon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
              return (
                <th
                  key={column.key}
                  scope="col"
                  className={cx(column.numeric && styles.numeric)}
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <button
                    type="button"
                    className={cx(styles.sort, active && styles.sortActive)}
                    onClick={() => toggleSort(column.key)}
                    title={t('assignments.table.sortBy', { column: t(column.label) })}
                  >
                    {t(column.label)}
                    <SortIcon aria-hidden="true" />
                  </button>
                </th>
              );
            })}
            <th scope="col" className={styles.actionsHead}>
              <span className={styles.srOnly}>{t('assignments.table.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const { assignment } = row;
            const pending = isPendingId(assignment.id);
            return (
              <tr
                key={assignment.id}
                className={cx(
                  styles.row,
                  pending && styles.pending,
                  focus === assignment.id && styles.focused,
                )}
                aria-busy={pending || undefined}
              >
                <td>
                  <span className={styles.taskCell} style={seriesStyle(taskColor(assignment.task_id))}>
                    <span className={styles.swatch} aria-hidden="true" />
                    <span className={styles.taskName}>{row.taskName}</span>
                    {row.done && (
                      <Badge tone="success" icon={<CheckCircle2 />}>
                        {t('assignments.table.done')}
                      </Badge>
                    )}
                  </span>
                </td>
                <td>
                  <span className={styles.workerCell}>
                    <Avatar name={row.workerName} id={assignment.worker_id} size="sm" />
                    {row.workerName}
                  </span>
                </td>
                <td>
                  <DateCell iso={assignment.start_date} />
                </td>
                <td>
                  <DateCell iso={assignment.end_date} />
                </td>
                <td className={styles.numeric}>{t('common.hours', { hours: row.effort })}</td>
                <td>
                  <div className={styles.actions}>
                    <IconButton
                      size="sm"
                      icon={<CalendarDays />}
                      label={t('assignments.table.viewCalendar', { task: row.taskName })}
                      disabled={pending}
                      onClick={() => openWorker(assignment.worker_id, assignment.start_date, assignment.id)}
                    />
                    <IconButton
                      size="sm"
                      icon={<Undo2 />}
                      label={t('assignments.table.unassign', { task: row.taskName })}
                      disabled={pending}
                      onClick={() => onUnassign(row)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
