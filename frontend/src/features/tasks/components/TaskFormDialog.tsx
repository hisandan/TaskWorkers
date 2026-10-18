// Diálogo "Nueva tarea" / "Editar tarea".
// Contrato del e2e: <form aria-label="Nueva tarea">, labels Nombre / Esfuerzo / Skills (separadas por coma),
// botón Crear; errores de la API en <FormError> (role="alert"), nunca toasts dentro del diálogo.

import { useState, type SubmitEvent } from 'react';

import { errorMessage } from '@src/api/errors';
import { useCreateTask, useUpdateTask, type Task, type TaskStatus } from '@src/api/hooks';
import { usePlannerData } from '@src/features/planner';
import { t } from '@src/i18n/t';
import {
  Button,
  Chip,
  ChipList,
  Dialog,
  DialogFooter,
  Field,
  FormError,
  FormRow,
  FormStack,
  Input,
  Select,
  useToast,
} from '@src/shared/components';
import { formatSkills, parseSkills } from '@src/shared/lib/skills';
import { markRecentTask } from '@src/features/tasks/lib/recentTask';
import styles from '@src/features/tasks/components/TaskFormDialog.module.css';

export interface TaskFormDialogProps {
  /** Sin task: "Nueva tarea" (POST). Con task: "Editar tarea" (PUT, con Estado). */
  task?: Task;
  onClose: () => void;
}

interface FieldErrors {
  name?: string;
  effort?: string;
}

const STATUSES: TaskStatus[] = ['not-done', 'done'];

function validate(name: string, effort: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = t('tasks.form.errors.nameRequired');
  const value = Number(effort.trim());
  if (!/^\d+$/.test(effort.trim()) || !Number.isSafeInteger(value) || value <= 0) {
    errors.effort = t('tasks.form.errors.effortInvalid');
  }
  return errors;
}

export function TaskFormDialog({ task, onClose }: TaskFormDialogProps) {
  const editing = task !== undefined;
  const toast = useToast();
  const data = usePlannerData();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [name, setName] = useState(task?.name ?? '');
  const [effort, setEffort] = useState(task ? String(task.effort) : '');
  const [skillsText, setSkillsText] = useState(task ? formatSkills(task.skills) : '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'not-done');
  // Validar en vivo solo después del primer intento de enviar (no regañar mientras se escribe)
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const busy = createTask.isPending || updateTask.isPending;
  const errors = submitted ? validate(name, effort) : {};
  const skills = parseSkills(skillsText);

  const assignment = task ? data.assignmentByTaskId.get(task.id) : undefined;
  const assignedWorker = assignment ? data.workerById.get(assignment.worker_id) : undefined;

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setApiError(null);

    const found = validate(name, effort);
    if (found.name || found.effort) {
      const form = event.currentTarget;
      // Llevar el foco al primer campo con error
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    const body = { name: name.trim(), effort: Number(effort.trim()), skills };

    try {
      if (!task) {
        const created = await createTask.mutateAsync(body);
        markRecentTask(created.id);
        toast.success(t('tasks.toast.created', { name: created.name }));
      } else {
        const unchanged =
          body.name === task.name &&
          body.effort === task.effort &&
          status === task.status &&
          formatSkills(body.skills) === formatSkills(task.skills);
        if (!unchanged) {
          const updated = await updateTask.mutateAsync({ id: task.id, body: { ...body, status } });
          markRecentTask(updated.id);
          toast.success(t('tasks.toast.updated', { name: updated.name }));
        }
      }
      onClose();
    } catch (error) {
      setApiError(errorMessage(error, { task: body.name, name: body.name }));
    }
  }

  const effortHint =
    editing && assignedWorker
      ? t('tasks.form.effortRescheduleHint', { worker: assignedWorker.name })
      : t('tasks.form.effortHint');

  return (
    <Dialog
      open
      title={editing ? t('tasks.form.editTitle') : t('tasks.form.createTitle')}
      onClose={onClose}
      busy={busy}
    >
      <form
        aria-label={editing ? t('tasks.form.editLabel') : t('tasks.form.createLabel')}
        noValidate
        onSubmit={onSubmit}
      >
        <FormStack>
          <Field label={t('tasks.form.name')} error={errors.name}>
            <Input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('tasks.form.namePlaceholder')}
              autoComplete="off"
              required
              maxLength={200}
            />
          </Field>

          <FormRow>
            <Field label={t('tasks.form.effort')} hint={effortHint} error={errors.effort}>
              <Input
                name="effort"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={effort}
                onChange={(event) => setEffort(event.target.value)}
                required
              />
            </Field>
            {editing && (
              <Field label={t('tasks.form.status')}>
                <Select
                  name="status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as TaskStatus)}
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {t(value === 'done' ? 'tasks.status.done' : 'tasks.status.not-done')}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </FormRow>

          <div className={styles.skills}>
            <Field label={t('tasks.form.skills')}>
              <Input
                name="skills"
                value={skillsText}
                onChange={(event) => setSkillsText(event.target.value)}
                placeholder={t('tasks.form.skillsPlaceholder')}
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            {skills.length > 0 && (
              <div className={styles.preview} aria-hidden="true">
                <span>{t('tasks.form.skillsPreview')}</span>
                <ChipList>
                  {skills.map((skill) => (
                    <li key={skill}>
                      <Chip>{skill}</Chip>
                    </li>
                  ))}
                </ChipList>
              </div>
            )}
          </div>

          <FormError message={apiError} />
        </FormStack>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={busy}>
            {editing ? t('tasks.form.submitSave') : t('tasks.form.submitCreate')}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
