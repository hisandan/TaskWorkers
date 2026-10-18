// Diálogo "Asignar tarea".
// Los avisos (skills, fin de semana, pasado) no bloquean: la API decide y su error se muestra con nombres.
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMemo, useState, type SubmitEvent, type ReactNode } from 'react';

import { errorMessage } from '@src/api/errors';
import { useAssignTask } from '@src/api/hooks';
import { usePlanner, usePlannerData } from '@src/features/planner';
import { t } from '@src/i18n/t';
import {
  Button,
  Dialog,
  DialogFooter,
  Field,
  FormError,
  FormStack,
  Input,
  Select,
  useToast,
} from '@src/shared/components';
import { freeFrom } from '@src/shared/lib/agenda';
import {
  addDays,
  formatLongDay,
  formatShortDay,
  isPast,
  isWeekend,
  nextBusinessDay,
  today,
} from '@src/shared/lib/dates';
import { formatSkills, missingSkills } from '@src/shared/lib/skills';
import { cx } from '@src/shared/lib/cx';
import styles from '@src/features/assignments/components/AssignTaskDialog.module.css';

export interface AssignTaskDialogProps {
  /** Valores iniciales opcionales del formulario */
  taskId?: number;
  workerId?: number;
  /** YYYY-MM-DD */
  date?: string;
  onClose: () => void;
}

/** Siguiente día hábil después de hoy (igual que la auto-asignación, RN20) */
function defaultStart(): string {
  return nextBusinessDay(addDays(today(), 1));
}

function Hint({ tone, children }: { tone: 'ok' | 'warning'; children: ReactNode }) {
  return (
    <span className={cx(styles.hint, styles[tone])}>
      {tone === 'ok' ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}

export function AssignTaskDialog({ taskId, workerId, date, onClose }: AssignTaskDialogProps) {
  const toast = useToast();
  const { view, openWorker } = usePlanner();
  const { tasks, workers, taskById, workerById, assignmentByTaskId, agendas } = usePlannerData();
  const assignTask = useAssignTask();

  const [taskValue, setTaskValue] = useState(taskId !== undefined ? String(taskId) : '');
  const [workerValue, setWorkerValue] = useState(workerId !== undefined ? String(workerId) : '');
  const [start, setStart] = useState(date ?? defaultStart());
  const [apiError, setApiError] = useState<string | null>(null);

  // Tareas pendientes sin asignar (y la inicial, si vino una, para no perder la selección)
  const pendingTasks = useMemo(
    () =>
      tasks
        .filter(
          (task) => (task.status === 'not-done' && !assignmentByTaskId.has(task.id)) || task.id === taskId,
        )
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [tasks, assignmentByTaskId, taskId],
  );
  const sortedWorkers = useMemo(
    () => [...workers].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [workers],
  );

  const task = taskValue ? taskById.get(Number(taskValue)) : undefined;
  const worker = workerValue ? workerById.get(Number(workerValue)) : undefined;
  const missing = task && worker ? missingSkills(task, worker) : [];

  let workerHint: ReactNode = null;
  if (task && worker) {
    const agenda = agendas.get(worker.id);
    workerHint =
      missing.length > 0 ? (
        <Hint tone="warning">{t('assignments.form.workerMissing', { skills: formatSkills(missing) })}</Hint>
      ) : (
        <Hint tone="ok">
          {t('assignments.form.workerFits', {
            date: formatShortDay(agenda ? freeFrom(agenda, today()) : nextBusinessDay(today())),
          })}
        </Hint>
      );
  } else if (workers.length === 0) {
    workerHint = t('assignments.form.noWorkers');
  }

  let startHint: ReactNode = start ? formatLongDay(start) : null;
  if (start && isPast(start)) startHint = <Hint tone="warning">{t('assignments.form.startPast')}</Hint>;
  else if (start && isWeekend(start))
    startHint = <Hint tone="warning">{t('assignments.form.startWeekend')}</Hint>;

  const taskHint = task
    ? t('assignments.form.taskSummary', {
        effort: t('common.hours', { hours: task.effort }),
        skills: task.skills.length > 0 ? formatSkills(task.skills) : t('assignments.form.noSkills'),
      })
    : pendingTasks.length === 0
      ? t('assignments.form.noTasks')
      : null;

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError(null);
    if (!task || !worker || !start) {
      setApiError(t('assignments.form.required'));
      return;
    }
    try {
      const created = await assignTask.mutateAsync({
        task_id: task.id,
        worker_id: worker.id,
        start_date: start,
      });
      toast.success(
        t('assignments.toast.assigned', {
          task: task.name,
          worker: worker.name,
          date: formatShortDay(created.start_date),
        }),
      );
      onClose();
      // En la vista Equipo, mostrar dónde quedó; en la tabla, la fila aparece sola
      if (view === 'team') openWorker(worker.id, created.start_date, created.id);
    } catch (error) {
      setApiError(
        errorMessage(error, {
          task: task.name,
          worker: worker.name,
          missing: missing.length > 0 ? formatSkills(missing) : undefined,
        }),
      );
    }
  }

  const label = t('assignments.form.label');

  return (
    <Dialog
      open
      title={label}
      description={t('assignments.form.description')}
      onClose={onClose}
      busy={assignTask.isPending}
    >
      <form aria-label={label} onSubmit={onSubmit} noValidate>
        <FormStack>
          <Field label={t('assignments.form.task')} hint={taskHint}>
            <Select
              name="task"
              value={taskValue}
              onChange={(event) => {
                setTaskValue(event.target.value);
                setApiError(null);
              }}
              required
            >
              <option value="" disabled>
                {t('assignments.form.taskPlaceholder')}
              </option>
              {pendingTasks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('assignments.form.worker')} hint={workerHint}>
            <Select
              name="worker"
              value={workerValue}
              onChange={(event) => {
                setWorkerValue(event.target.value);
                setApiError(null);
              }}
              required
            >
              <option value="" disabled>
                {t('assignments.form.workerPlaceholder')}
              </option>
              {sortedWorkers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('assignments.form.start')} hint={startHint}>
            <Input
              name="start"
              type="date"
              value={start}
              min={today()}
              onChange={(event) => {
                setStart(event.target.value);
                setApiError(null);
              }}
              required
            />
          </Field>

          <FormError message={apiError} />
        </FormStack>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={assignTask.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={assignTask.isPending}>
            {t('assignments.form.submit')}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
