import { CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useRef, type CSSProperties, type PointerEventHandler } from 'react';

import { isPendingId, type Task, type Worker } from '@src/api/hooks';
import { t } from '@src/i18n/t';
import { Avatar, IconButton, Menu } from '@src/shared/components';
import type { DaySegment, WorkerAgenda } from '@src/shared/lib/agenda';
import { seriesStyle, taskColor, workerColor } from '@src/shared/lib/colors';
import {
  addDays,
  addWeeks,
  businessDaysOfWeeks,
  dayRange,
  formatDayMonth,
  formatDayRange,
  formatLongDay,
  formatShortDay,
  formatWeekdayLetter,
  isPast,
  isWeekend,
  today,
  type ISODate,
} from '@src/shared/lib/dates';
import { missingSkills } from '@src/shared/lib/skills';
import {
  useActiveDrag,
  usePlanner,
  usePlannerData,
  usePlannerDraggable,
  usePlannerDroppable,
  CALENDAR_WEEKS,
} from '@src/features/planner';
import { FocusBar } from '@src/features/schedule/components/FocusBar';
import { useWorkerMenu } from '@src/features/schedule/components/useWorkerMenu';
import { WorkerSkills, WorkerStats } from '@src/features/schedule/components/WorkerMeta';
import styles from '@src/features/schedule/components/WorkerCalendar.module.css';

/** Semanas (lunes a domingo) que muestra el calendario de un trabajador desde `week` */

/** Por encima de estas horas por día, la hora se achica para que la columna no crezca de más */
const MAX_FULL_SIZE_HOURS = 10;

/** Calendario de un trabajador: columnas de capacidad por día con las tareas apiladas */
export function WorkerCalendar({ worker }: { worker: Worker }) {
  const { week, focus, setFocus, closeWorker } = usePlanner();
  const { agendas, taskById, assignmentById } = usePlannerData();
  const active = useActiveDrag();
  const menu = useWorkerMenu(worker);
  const bodyRef = useRef<HTMLDivElement>(null);

  const agenda = agendas.get(worker.id);
  const weeks = useMemo(
    () => Array.from({ length: CALENDAR_WEEKS }, (_, i) => addWeeks(week, i)),
    [week],
  );
  const businessDays = useMemo(() => businessDaysOfWeeks(week, CALENDAR_WEEKS), [week]);
  const missing = active?.task ? missingSkills(active.task, worker) : [];

  const focused = focus !== null ? assignmentById.get(focus) : undefined;
  const focusedHere = focused && focused.worker_id === worker.id ? focused : undefined;

  const availability = worker.availability;
  const hourScale = availability > MAX_FULL_SIZE_HOURS ? MAX_FULL_SIZE_HOURS / availability : 1;
  const gridStyle = {
    ...seriesStyle(workerColor(worker.id)),
    '--hour': `calc(var(--size-planner-hour) * ${hourScale})`,
    '--hours': availability,
  } as CSSProperties;

  // Al abrir con una asignación resaltada (o al cambiarla), que se vea
  useEffect(() => {
    if (focus === null) return;
    const block = bodyRef.current?.querySelector(`[data-assignment="${focus}"]`);
    block?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [focus, week, worker.id]);

  return (
    <section
      className={styles.calendar}
      aria-label={t('schedule.calendar.label', { name: worker.name })}
      data-mismatch={missing.length > 0 || undefined}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && focus !== null) setFocus(null);
      }}
    >
      <header className={styles.header} style={seriesStyle(workerColor(worker.id))}>
        <Avatar name={worker.name} id={worker.id} className={styles.avatar} />
        <div className={styles.identity}>
          <h2 className={styles.title}>{worker.name}</h2>
          <WorkerStats worker={worker} agenda={agenda} days={businessDays} />
        </div>
        <WorkerSkills worker={worker} missing={missing} className={styles.skills} />
        <div className={styles.headerActions}>
          <Menu items={menu} label={t('schedule.worker.actions', { name: worker.name })} />
          <IconButton
            label={t('schedule.calendar.close')}
            icon={<X />}
            size="sm"
            variant="secondary"
            onClick={closeWorker}
          />
        </div>
      </header>

      {focusedHere && <FocusBar assignment={focusedHere} worker={worker} agenda={agenda} />}

      <div ref={bodyRef} className={styles.scroller}>
        <div className={styles.weeks} style={gridStyle}>
          {weeks.map((monday) => (
            <CalendarWeek
              key={monday}
              monday={monday}
              worker={worker}
              agenda={agenda}
              taskById={taskById}
              focus={focusedHere?.id ?? null}
              sourceId={active?.data.kind === 'assignment' ? active.data.assignmentId : null}
              dragging={active !== null}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface WeekProps {
  monday: ISODate;
  worker: Worker;
  agenda: WorkerAgenda | undefined;
  taskById: Map<number, Task>;
  focus: number | null;
  sourceId: number | null;
  dragging: boolean;
}

function CalendarWeek({ monday, ...rest }: WeekProps) {
  const days = dayRange(monday, 7);
  const sunday = addDays(monday, 6);
  const label = t('schedule.calendar.weekLabel', { from: formatDayMonth(monday), to: formatDayMonth(sunday) });
  const step = rest.worker.availability > 8 ? 2 : 1;
  const ticks = Array.from({ length: Math.floor(rest.worker.availability / step) }, (_, i) => (i + 1) * step);

  return (
    <div className={styles.week} role="group" aria-label={label}>
      <p className={styles.weekLabel} aria-hidden="true">
        {label}
      </p>
      <div className={styles.grid}>
        {/* Eje de horas: decorativo (cada columna dice sus horas) */}
        <div className={styles.axis} aria-hidden="true" title={t('schedule.calendar.axis')}>
          <div className={styles.axisHead} />
          <div className={styles.axisBody}>
            {ticks.map((hour) => (
              <span key={hour} className={styles.tick} style={{ '--at': hour } as CSSProperties}>
                {t('schedule.calendar.axisHour', { hours: hour })}
              </span>
            ))}
          </div>
        </div>
        {days.map((day) =>
          isWeekend(day) ? <WeekendColumn key={day} day={day} /> : <DayColumn key={day} day={day} {...rest} />,
        )}
      </div>
    </div>
  );
}

/** Sábado y domingo: angostos, rayados y sin drop (RN12, RN13) */
function WeekendColumn({ day }: { day: ISODate }) {
  return (
    <div className={styles.weekend} title={`${formatLongDay(day)} · ${t('schedule.calendar.weekend')}`} aria-hidden="true">
      <div className={styles.dayHead}>
        <span className={styles.weekday}>{formatWeekdayLetter(day)}</span>
      </div>
      <div className={styles.weekendBody} />
    </div>
  );
}

function DayColumn({ day, worker, agenda, taskById, focus, sourceId, dragging }: { day: ISODate } & Omit<WeekProps, 'monday'>) {
  const drop = usePlannerDroppable({ kind: 'day', workerId: worker.id, date: day });
  const usage = agenda?.byDay.get(day);
  const availability = worker.availability;
  const used = usage?.used ?? 0;
  const free = Math.max(0, availability - used);
  const past = isPast(day);
  const isToday = day === today();
  const [weekday, number] = formatShortDay(day).split(' ');

  return (
    <div
      className={styles.day}
      role="group"
      aria-label={t('schedule.calendar.dayLabel', { date: formatLongDay(day), used, available: availability })}
      data-today={isToday || undefined}
      data-past={past || undefined}
      data-droppable={(dragging && !drop.disabled) || undefined}
      data-over={(drop.isOver && !drop.disabled) || undefined}
      aria-current={isToday ? 'date' : undefined}
    >
      <div className={styles.dayHead}>
        <span className={styles.weekday}>{weekday}</span>
        <span className={styles.dayNumber}>{number}</span>
        {free === 0 && used > 0 && <span className={styles.full}>{t('schedule.calendar.full')}</span>}
      </div>
      <div ref={drop.setNodeRef} className={styles.dayBody}>
        {usage?.segments.map((segment) => (
          <CalendarBlock
            key={segment.assignmentId}
            segment={segment}
            day={day}
            worker={worker}
            agenda={agenda}
            task={taskById.get(segment.taskId)}
            focused={focus === segment.assignmentId}
            dimmed={focus !== null && focus !== segment.assignmentId}
            source={sourceId === segment.assignmentId}
          />
        ))}
        {free > 0 && (
          <div className={styles.free} style={{ flexGrow: free }}>
            {!past && free >= 1 && (
              <span className={styles.freeLabel}>{t('schedule.calendar.free', { hours: free })}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarBlock({
  segment,
  day,
  worker,
  agenda,
  task,
  focused,
  dimmed,
  source,
}: {
  segment: DaySegment;
  day: ISODate;
  worker: Worker;
  agenda: WorkerAgenda | undefined;
  task: Task | undefined;
  focused: boolean;
  dimmed: boolean;
  source: boolean;
}) {
  const { setFocus } = usePlanner();
  const done = task?.status === 'done';
  // Una tarea done no se mueve (RN31); se puede desasignar desde la barra de selección (RN30)
  const drag = usePlannerDraggable(
    { kind: 'assignment', assignmentId: segment.assignmentId, taskId: segment.taskId, workerId: worker.id },
    { disabled: done },
  );
  // Solo el puntero arrastra desde el bloque: el teclado usa el botón para seleccionar
  // (mover con teclado: tarjeta "En agenda" de la columna de tareas)
  const onPointerDown = drag.listeners?.onPointerDown as PointerEventHandler | undefined;

  const days = agenda?.byAssignment.get(segment.assignmentId) ?? [];
  const index = days.findIndex((d) => d.date === day);
  const first = index <= 0;
  const last = index === -1 || index === days.length - 1;
  const total = task?.effort ?? segment.hours;
  const name = task?.name ?? t('planner.dnd.unknownTask');
  const range = days.length > 0 ? formatDayRange(days[0].date, days[days.length - 1].date) : formatShortDay(day);
  const pending = isPendingId(segment.assignmentId);

  const label = [
    t('schedule.calendar.block', { task: name, hours: segment.hours, date: formatLongDay(day), range }),
    done ? t('schedule.calendar.done') : null,
    !first ? t('schedule.calendar.continued') : null,
    !last ? t('schedule.calendar.continues') : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <div
      ref={drag.setNodeRef}
      className={styles.block}
      style={{ ...seriesStyle(taskColor(segment.taskId)), '--h': segment.hours } as CSSProperties}
      data-assignment={segment.assignmentId}
      data-first={first || undefined}
      data-last={last || undefined}
      data-tall={segment.hours >= 2 || undefined}
      data-done={done || undefined}
      data-focused={focused || undefined}
      data-dimmed={dimmed || undefined}
      data-dragging={(drag.isDragging || source) || undefined}
      data-draggable={(!done && !pending) || undefined}
      data-pending={pending || undefined}
      onPointerDown={onPointerDown}
    >
      <button
        type="button"
        className={styles.blockButton}
        aria-label={label}
        aria-pressed={focused}
        title={`${name} · ${t('schedule.calendar.blockOf', { hours: segment.hours, total })} · ${range}`}
        onClick={() => setFocus(focused ? null : segment.assignmentId)}
      >
        {!first && <ChevronLeft className={styles.continuedIcon} aria-hidden="true" />}
        <span className={styles.blockName}>
          {done && <CheckCircle2 className={styles.doneIcon} aria-hidden="true" />}
          {name}
        </span>
        <span className={styles.blockHours}>
          {segment.hours === total
            ? t('schedule.calendar.blockHours', { hours: segment.hours })
            : t('schedule.calendar.blockOf', { hours: segment.hours, total })}
        </span>
        {!last && <ChevronRight className={styles.continuesIcon} aria-hidden="true" />}
      </button>
    </div>
  );
}
