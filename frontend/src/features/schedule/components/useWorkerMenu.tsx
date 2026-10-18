import { Pencil, Trash2 } from 'lucide-react';

import { useDeleteWorker, type Worker } from '@src/api/hooks';
import { t } from '@src/i18n/t';
import type { MenuItem } from '@src/shared/components';
import { usePlanner } from '@src/features/planner';

/** Ítems del menú ⋯ de un trabajador: Editar (diálogo) y Eliminar (confirmación; HasAssignments -> mensaje) */
export function useWorkerMenu(worker: Worker): MenuItem[] {
  const { dialogs, workerId, closeWorker } = usePlanner();
  const deleteWorker = useDeleteWorker();

  return [
    {
      id: 'edit',
      label: t('schedule.worker.edit'),
      icon: <Pencil />,
      onSelect: () => dialogs.open({ type: 'workerForm', worker }),
    },
    {
      id: 'delete',
      label: t('schedule.worker.delete'),
      icon: <Trash2 />,
      danger: true,
      separated: true,
      onSelect: () =>
        dialogs.confirm({
          title: t('schedule.worker.deleteTitle'),
          message: t('schedule.worker.deleteMessage', { name: worker.name }),
          confirmLabel: t('common.delete'),
          errorContext: { name: worker.name, worker: worker.name },
          onConfirm: async () => {
            await deleteWorker.mutateAsync(worker.id);
            if (workerId === worker.id) closeWorker();
          },
        }),
    },
  ];
}
