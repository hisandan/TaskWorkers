// Acciones del menú ⋯ de una tarjeta de tarea. Se crean una vez en TaskBoard y se pasan a las tarjetas
// (una sola instancia de cada mutation para toda la columna).
//
// - Fuera de diálogos los resultados van en toasts (éxito role="status", error role="alert").
// - Eliminar usa ConfirmDialog: si la API rechaza (HasAssignments), el error se ve dentro del diálogo.

import { errorMessage } from '@src/api/errors';
import { useDeleteTask, useUnassign, useUpdateTask, type Assignment, type Task } from '@src/api/hooks';
import { useDialogs } from '@src/features/planner';
import { t } from '@src/i18n/t';
import { useToast } from '@src/shared/components';
import { markRecentTask } from '@src/features/tasks/lib/recentTask';

export interface TaskActions {
  edit: (task: Task) => void;
  assign: (task: Task) => void;
  toggleDone: (task: Task) => void;
  unassign: (task: Task, assignment: Assignment) => void;
  remove: (task: Task) => void;
}

export function useTaskActions(): TaskActions {
  const toast = useToast();
  const { open, confirm } = useDialogs();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: unassignTask } = useUnassign();
  const { mutateAsync: deleteTask } = useDeleteTask();

  return {
    edit: (task) => open({ type: 'taskForm', task }),

    assign: (task) => open({ type: 'assign', taskId: task.id }),

    toggleDone: (task) => {
      const status = task.status === 'done' ? 'not-done' : 'done';
      updateTask(
        { id: task.id, body: { name: task.name, effort: task.effort, skills: task.skills, status } },
        {
          onSuccess: () => {
            // Cambia de bloque (pendientes <-> terminadas): llevarla a la vista y resaltarla
            markRecentTask(task.id);
            toast.success(
              t(status === 'done' ? 'tasks.toast.markedDone' : 'tasks.toast.markedPending', {
                name: task.name,
              }),
            );
          },
          onError: (error) => toast.error(errorMessage(error, { task: task.name })),
        },
      );
    },

    unassign: (task, assignment) => {
      unassignTask(assignment.id, {
        onSuccess: () => toast.success(t('tasks.toast.unassigned', { name: task.name })),
        onError: (error) => toast.error(errorMessage(error, { task: task.name })),
      });
    },

    remove: (task) =>
      confirm({
        title: t('tasks.confirmDelete.title'),
        message: t('tasks.confirmDelete.message', { name: task.name }),
        confirmLabel: t('tasks.actions.delete'),
        errorContext: { task: task.name, name: task.name },
        onConfirm: async () => {
          await deleteTask(task.id);
          toast.success(t('tasks.toast.deleted', { name: task.name }));
        },
      }),
  };
}
