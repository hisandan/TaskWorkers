import { AlertTriangle, UserPlus, UserX, Users } from 'lucide-react';

import { errorMessage } from '@src/api/errors';
import { t } from '@src/i18n/t';
import { Button, EmptyState, Skeleton, Spinner } from '@src/shared/components';
import { usePlanner, usePlannerData } from '@src/features/planner';
import { TeamView } from '@src/features/schedule/components/TeamView';
import { WorkerCalendar } from '@src/features/schedule/components/WorkerCalendar';
import styles from '@src/features/schedule/components/ScheduleView.module.css';

/** Panel derecho, vista Equipo: filas trabajador × días hábiles o, con worker en la URL, su calendario */
export function ScheduleView() {
  const { workerId, closeWorker, dialogs } = usePlanner();
  const data = usePlannerData();

  if (data.isPending) return <ScheduleSkeleton />;

  if (data.error) {
    return (
      <EmptyState
        icon={<AlertTriangle />}
        title={t('schedule.loadError')}
        description={errorMessage(data.error)}
        action={
          <Button size="sm" onClick={data.refetch}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  }

  if (workerId !== null) {
    const worker = data.workerById.get(workerId);
    if (!worker) {
      return (
        <EmptyState
          icon={<UserX />}
          title={t('schedule.calendar.notFound')}
          action={
            <Button size="sm" onClick={closeWorker}>
              {t('schedule.calendar.back')}
            </Button>
          }
        />
      );
    }
    return <WorkerCalendar key={worker.id} worker={worker} />;
  }

  if (data.workers.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title={t('schedule.empty.title')}
        description={t('schedule.empty.description')}
        action={
          <Button
            size="sm"
            variant="primary"
            icon={<UserPlus />}
            onClick={() => dialogs.open({ type: 'workerForm' })}
          >
            {t('schedule.empty.action')}
          </Button>
        }
      />
    );
  }

  return <TeamView />;
}

function ScheduleSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true">
      <Spinner label={t('schedule.loading')} className={styles.spinner} />
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className={styles.skeletonRow}>
          <Skeleton width="var(--size-avatar)" height="var(--size-avatar)" radius="full" />
          <div className={styles.skeletonText}>
            <Skeleton width="60%" />
            <Skeleton width="85%" height="var(--space-3)" />
          </div>
          <Skeleton height="var(--size-planner-row)" radius="md" />
        </div>
      ))}
    </div>
  );
}
