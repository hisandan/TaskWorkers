// Columna izquierda del planificador:
// pestañas Por asignar / En agenda, búsqueda por nombre, filtro por skill, tarjetas arrastrables y
// la zona "Desasignar" al pie mientras se arrastra una asignación.
//
// Decisiones:
// - "Por asignar" = tareas pendientes sin asignación (arrastrables). Las terminadas sin asignación van
//   al final de esa pestaña, en un bloque plegable "Terminadas sin agenda": atenuadas y no arrastrables.
// - "En agenda" = todas las asignadas (también las terminadas, RN23), ordenadas por fecha de inicio.
// - Los contadores de las pestañas respetan la búsqueda y el filtro.
// - Si el Planner resalta una asignación (focus), se pasa a "En agenda" y se muestra la tarjeta.

import { CalendarCheck, CalendarRange, Inbox, ListTodo, Plus, Search, SearchX, Undo2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { Assignment, Task } from '@src/api/hooks';
import { useActiveDrag, useDialogs, usePlanner, usePlannerData, usePlannerDroppable } from '@src/features/planner';
import { t } from '@src/i18n/t';
import {
  Button,
  EmptyState,
  IconButton,
  Input,
  Segmented,
  Select,
  Skeleton,
  Spinner,
  tabPanelProps,
  type TabItem,
} from '@src/shared/components';
import { allSkills } from '@src/shared/lib/skills';
import type { ISODate } from '@src/shared/lib/dates';
import { TaskCard } from '@src/features/tasks/components/TaskCard';
import { useRecentTaskId } from '@src/features/tasks/lib/recentTask';
import { useTaskActions } from '@src/features/tasks/useTaskActions';
import styles from '@src/features/tasks/components/TaskBoard.module.css';

type BoardTab = 'pending' | 'scheduled';

const TABS_ID = 'tasks-board';

/** Minúsculas y sin tildes: "migración" coincide con "migracion" */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function TaskBoard() {
  const data = usePlannerData();
  const { focus } = usePlanner();
  const { open } = useDialogs();
  const active = useActiveDrag();
  const recentId = useRecentTaskId();
  const actions = useTaskActions();

  const [tab, setTab] = useState<BoardTab>('pending');
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState('');
  const [doneOpen, setDoneOpen] = useState(false);

  const filtering = query.trim() !== '' || skill !== '';

  const { pending, done, scheduled, skills } = useMemo(() => {
    const q = normalize(query);
    const matches = (task: Task) =>
      (!q || normalize(task.name).includes(q)) && (!skill || task.skills.includes(skill));

    const pending: Task[] = [];
    const done: Task[] = [];
    const scheduled: { task: Task; assignment: Assignment }[] = [];
    for (const task of data.tasks) {
      if (!matches(task)) continue;
      const assignment = data.assignmentByTaskId.get(task.id);
      if (assignment) scheduled.push({ task, assignment });
      else if (task.status === 'done') done.push(task);
      else pending.push(task);
    }
    pending.sort((a, b) => a.id - b.id);
    done.sort((a, b) => a.id - b.id);
    scheduled.sort((a, b) =>
      a.assignment.start_date === b.assignment.start_date
        ? a.assignment.id - b.assignment.id
        : a.assignment.start_date < b.assignment.start_date
          ? -1
          : 1,
    );
    return { pending, done, scheduled, skills: allSkills(data.tasks) };
  }, [data.tasks, data.assignmentByTaskId, query, skill]);

  // Asignación resaltada desde el calendario o el badge: mostrarla en "En agenda"
  const focusedTaskId = focus === null ? undefined : data.assignmentById.get(focus)?.task_id;
  useEffect(() => {
    if (focusedTaskId !== undefined) setTab('scheduled');
  }, [focus, focusedTaskId]);

  // Tarea recién creada o editada: llevarla a la vista aunque los filtros la escondan.
  // Corre solo cuando cambia la tarea marcada o cuando llega de la API (recentLoaded), no al filtrar.
  const recentTask = recentId === null ? undefined : data.taskById.get(recentId);
  const recentLoaded = recentTask !== undefined;
  useEffect(() => {
    const task = recentTask;
    if (!task) return;
    const assigned = data.assignmentByTaskId.has(task.id);
    setTab(assigned ? 'scheduled' : 'pending');
    if (!assigned && task.status === 'done') setDoneOpen(true);
    const q = normalize(query);
    if ((q && !normalize(task.name).includes(q)) || (skill && !task.skills.includes(skill))) {
      setQuery('');
      setSkill('');
    }
  }, [recentId, recentLoaded]);

  const tabs: TabItem<BoardTab>[] = [
    { value: 'pending', label: t('tasks.board.tabPending'), count: pending.length, icon: <Inbox /> },
    {
      value: 'scheduled',
      label: t('tasks.board.tabScheduled'),
      count: scheduled.length,
      icon: <CalendarRange />,
    },
  ];

  function clearFilters() {
    setQuery('');
    setSkill('');
  }

  function rangeOf(assignment: Assignment): { start: ISODate; end: ISODate } {
    // Optimista (id < 0): la API aún no dio el fin; se usa la agenda visual
    if (assignment.id < 0) {
      const days = data.agendas.get(assignment.worker_id)?.byAssignment.get(assignment.id);
      if (days?.length) return { start: days[0].date, end: days[days.length - 1].date };
    }
    return { start: assignment.start_date, end: assignment.end_date };
  }

  function renderBody() {
    if (data.isPending) {
      return (
        <div className={styles.loading} aria-busy="true">
          <Spinner size="sm" label={t('tasks.board.loading')} />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height="var(--size-planner-row)" radius="md" />
          ))}
        </div>
      );
    }

    if (data.error && data.tasks.length === 0) {
      return (
        <EmptyState
          size="compact"
          icon={<ListTodo />}
          title={t('tasks.loadError')}
          action={
            <Button size="sm" onClick={data.refetch}>
              {t('common.retry')}
            </Button>
          }
        />
      );
    }

    if (data.tasks.length === 0) {
      return (
        <EmptyState
          size="compact"
          icon={<ListTodo />}
          title={t('tasks.empty.noTasksTitle')}
          description={t('tasks.empty.noTasksDescription')}
          action={
            <Button size="sm" variant="primary" icon={<Plus />} onClick={() => open({ type: 'taskForm' })}>
              {t('tasks.empty.noTasksAction')}
            </Button>
          }
        />
      );
    }

    const filteredEmpty = (
      <EmptyState
        size="compact"
        icon={<SearchX />}
        title={t('tasks.empty.filteredTitle')}
        description={t('tasks.empty.filteredDescription')}
        action={
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            {t('tasks.empty.clearFilters')}
          </Button>
        }
      />
    );

    if (tab === 'scheduled') {
      if (scheduled.length === 0) {
        return filtering ? (
          filteredEmpty
        ) : (
          <EmptyState
            size="compact"
            icon={<CalendarRange />}
            title={t('tasks.empty.scheduledTitle')}
            description={t('tasks.empty.scheduledDescription')}
          />
        );
      }
      return (
        <ul className={styles.list} aria-label={t('tasks.board.listScheduled')}>
          {scheduled.map(({ task, assignment }) => (
            <li key={task.id} className={styles.item}>
              <TaskCard
                task={task}
                assignment={assignment}
                worker={data.workerById.get(assignment.worker_id)}
                range={rangeOf(assignment)}
                focused={focus === assignment.id}
                recent={recentId === task.id}
                actions={actions}
              />
            </li>
          ))}
        </ul>
      );
    }

    return (
      <>
        {pending.length === 0 ? (
          filtering ? (
            // Si solo coinciden terminadas, se ven abajo (el bloque se abre solo al filtrar)
            done.length > 0 ? null : filteredEmpty
          ) : (
            <EmptyState
              size="compact"
              icon={<CalendarCheck />}
              title={t('tasks.empty.pendingTitle')}
              description={t('tasks.empty.pendingDescription')}
            />
          )
        ) : (
          <ul className={styles.list} aria-label={t('tasks.board.listPending')}>
            {pending.map((task) => (
              <li key={task.id} className={styles.item}>
                <TaskCard task={task} recent={recentId === task.id} actions={actions} />
              </li>
            ))}
          </ul>
        )}

        {done.length > 0 && (
          <details
            className={styles.done}
            open={doneOpen || filtering}
            onToggle={(event) => setDoneOpen(event.currentTarget.open)}
          >
            <summary className={styles.doneSummary}>
              {t('tasks.board.doneSection', { count: done.length })}
            </summary>
            <ul className={styles.list} aria-label={t('tasks.board.listDone')}>
              {done.map((task) => (
                <li key={task.id} className={styles.item}>
                  <TaskCard task={task} recent={recentId === task.id} actions={actions} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </>
    );
  }

  return (
    <div className={styles.board}>
      <div className={styles.controls}>
        <Segmented
          label={t('tasks.board.tabsLabel')}
          idPrefix={TABS_ID}
          items={tabs}
          value={tab}
          onChange={setTab}
          size="sm"
          className={styles.tabs}
        />
        <div className={styles.filters} role="search" aria-label={t('tasks.board.filtersLabel')}>
          <div className={styles.search}>
            <Search className={styles.searchIcon} aria-hidden="true" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && query) {
                  event.stopPropagation();
                  setQuery('');
                }
              }}
              placeholder={t('tasks.board.searchPlaceholder')}
              aria-label={t('tasks.board.search')}
              className={styles.searchInput}
            />
            {query && (
              <IconButton
                label={t('tasks.board.clearSearch')}
                icon={<X />}
                size="sm"
                className={styles.clear}
                onClick={() => setQuery('')}
              />
            )}
          </div>
          <Select
            value={skill}
            onChange={(event) => setSkill(event.target.value)}
            aria-label={t('tasks.board.skillFilter')}
            className={styles.skill}
            data-active={skill !== '' || undefined}
          >
            <option value="">{t('tasks.board.allSkills')}</option>
            {skills.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className={styles.panel} {...tabPanelProps(TABS_ID, tab)}>
        {renderBody()}
      </div>

      {active?.data.kind === 'assignment' && <UnassignZone />}
    </div>
  );
}

/** Zona al pie de la columna: soltar una asignación aquí la desasigna */
function UnassignZone() {
  const drop = usePlannerDroppable({ kind: 'unassign' });
  return (
    <div ref={drop.setNodeRef} className={styles.unassign} data-over={drop.isOver || undefined}>
      <span className={styles.unassignIcon} aria-hidden="true">
        <Undo2 />
      </span>
      <span className={styles.unassignText}>
        <strong>{t('tasks.board.unassignZone')}</strong>
        <span>{t('tasks.board.unassignHint')}</span>
      </span>
    </div>
  );
}
