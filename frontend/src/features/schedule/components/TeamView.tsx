import { useMemo } from 'react';

import type { Task, Worker } from '@src/api/hooks';
import { t } from '@src/i18n/t';
import { Avatar, Menu } from '@src/shared/components';
import type { DayUsage, WorkerAgenda } from '@src/shared/lib/agenda';
import { seriesStyle, taskColor, workerColor } from '@src/shared/lib/colors';
import { cx } from '@src/shared/lib/cx';
import {
  businessDaysOfWeeks,
  formatDayMonth,
  formatLongDay,
  formatShortDay,
  isPast,
  mondayOf,
  today,
  type ISODate,
} from '@src/shared/lib/dates';
import { missingSkills } from '@src/shared/lib/skills';
import {
  TEAM_WEEKS,
  useActiveDrag,
  usePlanner,
  usePlannerData,
  usePlannerDroppable,
  type ActiveDrag,
} from '@src/features/planner';
import { useWorkerMenu } from '@src/features/schedule/components/useWorkerMenu';
import { WorkerSkills, WorkerStats } from '@src/features/schedule/components/WorkerMeta';
import styles from '@src/features/schedule/components/TeamView.module.css';

/** 'lun 19' -> ['lun', '19'] */
function splitShortDay(day: ISODate): [string, string] {
  const [weekday = '', number = ''] = formatShortDay(day).split(' ');
  return [weekday, number];
}

/** Vista Equipo: una fila por trabajador × días hábiles de TEAM_WEEKS semanas desde `week` */
export function TeamView() {
  const { week } = usePlanner();
  const { workers, agendas, taskById } = usePlannerData();
  const active = useActiveDrag();
  const now = today();

  const days = useMemo(() => businessDaysOfWeeks(week, TEAM_WEEKS), [week]);
  const weeks = useMemo(() => [...new Set(days.map((day) => mondayOf(day)))], [days]);

  return (
    <div className={styles.scroller}>
      <table className={styles.table} aria-label={t('schedule.team.label')}>
        <colgroup>
          <col className={styles.headerCol} />
          {days.map((day) => (
            <col key={day} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" rowSpan={2} className={styles.corner}>
              {t('schedule.team.workerColumn')}
            </th>
            {weeks.map((monday, i) => (
              <th
                key={monday}
                scope="colgroup"
                colSpan={5}
                className={cx(styles.weekHead, i > 0 && styles.weekStart)}
              >
                {t('schedule.team.week', { date: formatDayMonth(monday) })}
              </th>
            ))}
          </tr>
          <tr>
            {days.map((day, i) => {
              const [weekday, number] = splitShortDay(day);
              const isToday = day === now;
              return (
                <th
                  key={day}
                  scope="col"
                  className={cx(styles.dayHead, i > 0 && day === mondayOf(day) && styles.weekStart)}
                  data-today={isToday || undefined}
                  data-past={isPast(day) || undefined}
                  aria-current={isToday ? 'date' : undefined}
                >
                  <abbr title={formatLongDay(day)} className={styles.dayAbbr}>
                    <span className={styles.weekday}>{weekday}</span>
                    <span className={styles.dayNumber}>{number}</span>
                  </abbr>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {workers.map((worker) => (
            <WorkerRow
              key={worker.id}
              worker={worker}
              days={days}
              agenda={agendas.get(worker.id)}
              taskById={taskById}
              active={active}
              now={now}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkerRow({
  worker,
  days,
  agenda,
  taskById,
  active,
  now,
}: {
  worker: Worker;
  days: readonly ISODate[];
  agenda: WorkerAgenda | undefined;
  taskById: Map<number, Task>;
  active: ActiveDrag | null;
  now: ISODate;
}) {
  const { openWorker } = usePlanner();
  const menu = useWorkerMenu(worker);
  const missing = active?.task ? missingSkills(active.task, worker) : [];
  const mismatch = missing.length > 0;
  const sourceId = active?.data.kind === 'assignment' ? active.data.assignmentId : null;

  return (
    <tr
      className={styles.row}
      data-mismatch={mismatch || undefined}
      data-match={(active && !mismatch) || undefined}
      onClick={() => openWorker(worker.id)}
    >
      <th scope="row" className={styles.rowHeader} style={seriesStyle(workerColor(worker.id))}>
        <div className={styles.rowHeaderInner}>
          <Avatar name={worker.name} id={worker.id} />
          <div className={styles.identity}>
            <button
              type="button"
              className={styles.name}
              aria-label={t('schedule.worker.openCalendar', { name: worker.name })}
              title={t('schedule.worker.openCalendar', { name: worker.name })}
              onClick={(event) => {
                event.stopPropagation();
                openWorker(worker.id);
              }}
            >
              {worker.name}
            </button>
            <WorkerStats worker={worker} agenda={agenda} days={days} className={styles.stats} />
            <WorkerSkills worker={worker} max={3} missing={missing} />
          </div>
          <Menu
            items={menu}
            label={t('schedule.worker.actions', { name: worker.name })}
            className={styles.rowMenu}
          />
        </div>
      </th>
      {days.map((day, i) => (
        <DayCell
          key={day}
          worker={worker}
          day={day}
          usage={agenda?.byDay.get(day)}
          taskById={taskById}
          dragging={active !== null}
          sourceId={sourceId}
          isToday={day === now}
          weekStart={i > 0 && day === mondayOf(day)}
        />
      ))}
    </tr>
  );
}

function DayCell({
  worker,
  day,
  usage,
  taskById,
  dragging,
  sourceId,
  isToday,
  weekStart,
}: {
  worker: Worker;
  day: ISODate;
  usage: DayUsage | undefined;
  taskById: Map<number, Task>;
  dragging: boolean;
  sourceId: number | null;
  isToday: boolean;
  weekStart: boolean;
}) {
  const drop = usePlannerDroppable({ kind: 'day', workerId: worker.id, date: day });
  const available = worker.availability;
  const used = usage?.used ?? 0;
  const segments = usage?.segments ?? [];
  const date = formatLongDay(day);

  const details = segments.map((segment) =>
    t('schedule.team.segment', {
      task: taskById.get(segment.taskId)?.name ?? t('planner.dnd.unknownTask'),
      hours: segment.hours,
    }),
  );
  const summary =
    used > 0 ? t('schedule.team.day', { date, used, available }) : t('schedule.team.dayFree', { date, available });

  return (
    <td
      ref={drop.setNodeRef}
      className={cx(styles.cell, weekStart && styles.weekStart)}
      title={[summary, ...details].join('\n')}
      data-today={isToday || undefined}
      data-past={isPast(day) || undefined}
      data-full={(available > 0 && used >= available) || undefined}
      data-droppable={(dragging && !drop.disabled) || undefined}
      data-over={(drop.isOver && !drop.disabled) || undefined}
    >
      <span className={styles.track} aria-hidden="true">
        {segments.map((segment) => {
          const task = taskById.get(segment.taskId);
          return (
            <span
              key={segment.assignmentId}
              className={styles.segment}
              style={{
                ...seriesStyle(taskColor(segment.taskId)),
                flexGrow: segment.hours,
              }}
              data-done={task?.status === 'done' || undefined}
              data-source={segment.assignmentId === sourceId || undefined}
            />
          );
        })}
        {used < available && <span className={styles.free} style={{ flexGrow: available - used }} />}
      </span>
      <span className="sr-only">{[summary, ...details].join(', ')}</span>
    </td>
  );
}
