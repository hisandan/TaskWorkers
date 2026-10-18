// Monta el diálogo abierto (useDialogs().dialog). Cada diálogo de feature se monta al abrir y se
// desmonta al cerrar: su estado interno (campos, error) arranca limpio cada vez.

import { AssignTaskDialog, AutoAssignResultDialog } from '@src/features/assignments';
import { TaskFormDialog } from '@src/features/tasks';
import { WorkerFormDialog } from '@src/features/workers';
import { ConfirmDialog } from '@src/shared/components';
import { useDialogs } from '@src/features/planner/PlannerContext';

export function PlannerDialogs() {
  const { dialog, close } = useDialogs();
  if (!dialog) return null;

  switch (dialog.type) {
    case 'taskForm':
      return <TaskFormDialog task={dialog.task} onClose={close} />;
    case 'workerForm':
      return <WorkerFormDialog worker={dialog.worker} onClose={close} />;
    case 'assign':
      return (
        <AssignTaskDialog
          taskId={dialog.taskId}
          workerId={dialog.workerId}
          date={dialog.date}
          onClose={close}
        />
      );
    case 'autoAssignResult':
      return <AutoAssignResultDialog result={dialog.result} onClose={close} />;
    case 'confirm': {
      const { type: _type, ...props } = dialog;
      return <ConfirmDialog {...props} onClose={close} />;
    }
  }
}
