import { CalendarPlus, DatabaseZap, Plus, RotateCcw, UserPlus, Zap } from 'lucide-react';

import { errorMessage } from '@src/api/errors';
import { useAutoAssign, useDevPopulate, useDevReset } from '@src/api/hooks';
import { t } from '@src/i18n/t';
import { Button, useToast } from '@src/shared/components';
import { useDialogs } from '@src/features/planner/PlannerContext';
import styles from '@src/features/planner/components/PlannerToolbar.module.css';

/**
 * [+ Nueva tarea] [+ Nuevo trabajador] [Asignar tarea]  ·····  [⚡ Auto-asignar]
 * `ready`: deshabilitada hasta hidratar, para que un clic sobre el HTML del servidor no se pierda
 */
export function PlannerToolbar({ ready }: { ready: boolean }) {
  const { open, confirm } = useDialogs();
  const toast = useToast();
  const autoAssign = useAutoAssign();
  const reset = useDevReset();
  const populate = useDevPopulate();

  // Reset y Populate borran todo: siempre con confirmación (solo para probar)
  function confirmReset() {
    confirm({
      title: t('planner.toolbar.dev.resetTitle'),
      message: t('planner.toolbar.dev.resetMessage'),
      confirmLabel: t('planner.toolbar.dev.resetConfirm'),
      onConfirm: async () => {
        await reset.mutateAsync();
        toast.success(t('planner.toolbar.dev.resetDone'));
      },
    });
  }

  function confirmPopulate() {
    confirm({
      title: t('planner.toolbar.dev.populateTitle'),
      message: t('planner.toolbar.dev.populateMessage'),
      confirmLabel: t('planner.toolbar.dev.populateConfirm'),
      onConfirm: async () => {
        await populate.mutateAsync();
        toast.success(t('planner.toolbar.dev.populateDone'));
      },
    });
  }

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
      <div className={styles.group}>
        <div className={styles.dev} role="group" aria-label={t('planner.toolbar.dev.label')}>
          <Button variant="ghost" icon={<RotateCcw />} disabled={!ready} onClick={confirmReset}>
            {t('planner.toolbar.dev.reset')}
          </Button>
          <Button variant="ghost" icon={<DatabaseZap />} disabled={!ready} onClick={confirmPopulate}>
            {t('planner.toolbar.dev.populate')}
          </Button>
        </div>
        <Button
          variant="primary"
          icon={<Zap />}
          loading={autoAssign.isPending}
          disabled={!ready}
          onClick={runAutoAssign}
        >
          {t('planner.toolbar.autoAssign')}
        </Button>
      </div>
    </div>
  );
}
