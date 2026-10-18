import { CalendarPlus, Plus, UserPlus, Zap } from 'lucide-react';

import { errorMessage } from '@src/api/errors';
import { useAutoAssign } from '@src/api/hooks';
import { t } from '@src/i18n/t';
import { Button, useToast } from '@src/shared/components';
import { useDialogs } from '@src/features/planner/PlannerContext';
import styles from '@src/features/planner/components/PlannerToolbar.module.css';

/**
 * [+ Nueva tarea] [+ Nuevo trabajador] [Asignar tarea]  ·····  [⚡ Auto-asignar]
 * `ready`: deshabilitada hasta hidratar, para que un clic sobre el HTML del servidor no se pierda
 */
export function PlannerToolbar({ ready }: { ready: boolean }) {
  const { open } = useDialogs();
  const toast = useToast();
  const autoAssign = useAutoAssign();

  function runAutoAssign() {
    autoAssign.mutate(undefined, {
      onSuccess: (result) => open({ type: 'autoAssignResult', result }),
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  return (
    <div className={styles.toolbar} aria-label={t('planner.toolbar.label')} role="group">
      <div className={styles.group}>
        <Button icon={<Plus />} disabled={!ready} onClick={() => open({ type: 'taskForm' })}>
          {t('planner.toolbar.newTask')}
        </Button>
        <Button icon={<UserPlus />} disabled={!ready} onClick={() => open({ type: 'workerForm' })}>
          {t('planner.toolbar.newWorker')}
        </Button>
        <Button icon={<CalendarPlus />} disabled={!ready} onClick={() => open({ type: 'assign' })}>
          {t('planner.toolbar.assign')}
        </Button>
      </div>
      <Button variant="primary" icon={<Zap />} loading={autoAssign.isPending} disabled={!ready} onClick={runAutoAssign}>
        {t('planner.toolbar.autoAssign')}
      </Button>
    </div>
  );
}
