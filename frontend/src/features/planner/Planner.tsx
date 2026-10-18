// Isla raíz del planificador (una sola en la página): datos, toasts, URL, diálogos y drag & drop.
// Las features se montan en sus slots.

import { DndContext, DragOverlay } from '@dnd-kit/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { queryClient } from '@src/api/client';
import { TaskBoard } from '@src/features/tasks';
import { ScheduleView } from '@src/features/schedule';
import { AssignmentsTable } from '@src/features/assignments';
import { t } from '@src/i18n/t';
import { Skeleton, Spinner, Tabs, tabPanelProps, ToastProvider, type TabItem } from '@src/shared/components';
import { useIsClient } from '@src/shared/hooks/useIsClient';
import { DragPreview } from '@src/features/planner/components/DragPreview';
import { PlannerDialogs } from '@src/features/planner/components/PlannerDialogs';
import { PlannerToolbar } from '@src/features/planner/components/PlannerToolbar';
import { WeekNav } from '@src/features/planner/components/WeekNav';
import {
  ActiveDragContext,
  PlannerContext,
  type DialogState,
  type DialogsApi,
  type PlannerContextValue,
} from '@src/features/planner/PlannerContext';
import { usePlannerData } from '@src/features/planner/usePlannerData';
import { usePlannerDnd } from '@src/features/planner/usePlannerDnd';
import { usePlannerState, type PlannerView } from '@src/features/planner/usePlannerState';
import styles from '@src/features/planner/Planner.module.css';

export const VIEW_TABS_ID = 'planner-view';

export default function Planner() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PlannerRoot />
      </ToastProvider>
    </QueryClientProvider>
  );
}

function PlannerRoot() {
  const state = usePlannerState();
  const data = usePlannerData();
  const dnd = usePlannerDnd(data);
  // SSR (client:load) pinta un esqueleto: las vistas dependen de hoy, de la URL y de la API
  const isClient = useIsClient();

  const [dialog, setDialog] = useState<DialogState | null>(null);
  const close = useCallback(() => setDialog(null), []);
  const dialogs = useMemo<DialogsApi>(
    () => ({
      dialog,
      open: setDialog,
      close,
      confirm: (options) => setDialog({ type: 'confirm', ...options }),
    }),
    [dialog, close],
  );

  const {
    view,
    workerId,
    week,
    focus,
    setView,
    setWeek,
    shiftWeeks,
    goToday,
    openWorker,
    closeWorker,
    setFocus,
  } = state;
  const value = useMemo<PlannerContextValue>(
    () => ({
      view,
      workerId,
      week,
      focus,
      setView,
      setWeek,
      shiftWeeks,
      goToday,
      openWorker,
      closeWorker,
      setFocus,
      dialogs,
    }),
    [
      view,
      workerId,
      week,
      focus,
      setView,
      setWeek,
      shiftWeeks,
      goToday,
      openWorker,
      closeWorker,
      setFocus,
      dialogs,
    ],
  );

  const viewTabs: TabItem<PlannerView>[] = [
    { value: 'team', label: t('planner.views.team') },
    { value: 'table', label: t('planner.views.table') },
  ];

  return (
    <PlannerContext.Provider value={value}>
      <DndContext sensors={dnd.sensors} accessibility={dnd.accessibility} {...dnd.handlers}>
        <ActiveDragContext.Provider value={dnd.active}>
          <div className={styles.planner} data-dragging={dnd.active ? dnd.active.data.kind : undefined}>
            <PlannerToolbar ready={isClient} />

            {!isClient ? (
              <PlannerSkeleton />
            ) : (
              <div className={styles.columns}>
                {/* Slot: features/tasks */}
                <section className={styles.sidebar} aria-label={t('planner.regions.tasks')}>
                  <TaskBoard />
                </section>

                <section className={styles.main} aria-label={t('planner.regions.schedule')}>
                  <header className={styles.mainHeader}>
                    <Tabs
                      label={t('planner.views.label')}
                      idPrefix={VIEW_TABS_ID}
                      items={viewTabs}
                      value={view}
                      onChange={setView}
                    />
                    {view === 'team' && <WeekNav />}
                  </header>
                  <div className={styles.panel} {...tabPanelProps(VIEW_TABS_ID, view)}>
                    {/* Slots: features/schedule (Equipo / calendario) y features/assignments (tabla) */}
                    {view === 'table' ? <AssignmentsTable /> : <ScheduleView />}
                  </div>
                </section>
              </div>
            )}
          </div>

          <DragOverlay className={styles.overlay} dropAnimation={null}>
            {dnd.active ? <DragPreview drag={dnd.active} /> : null}
          </DragOverlay>
        </ActiveDragContext.Provider>
      </DndContext>

      <PlannerDialogs />
    </PlannerContext.Provider>
  );
}

function PlannerSkeleton() {
  return (
    <div className={styles.columns} aria-busy="true">
      <div className={styles.sidebar}>
        <div className={styles.skeleton}>
          <Spinner />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height="var(--size-planner-row)" radius="md" />
          ))}
        </div>
      </div>
      <div className={styles.main}>
        <div className={styles.skeleton}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height="var(--size-planner-row)" radius="md" />
          ))}
        </div>
      </div>
    </div>
  );
}
