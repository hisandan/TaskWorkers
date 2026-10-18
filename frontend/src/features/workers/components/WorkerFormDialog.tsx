// Diálogo "Nuevo trabajador" / "Editar trabajador" (docs/planificador.md#diálogos).
// Valida en el cliente lo obvio (nombre, 1–24 h); las reglas de agenda (RN22, RN25) las decide la API.
import { useMemo, useState, type SubmitEvent } from 'react';

import { errorMessage, isApiError } from '@src/api/errors';
import { useCreateWorker, useUpdateWorker, type Worker } from '@src/api/hooks';
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
  useToast,
} from '@src/shared/components';
import { formatSkills, parseSkills } from '@src/shared/lib/skills';
import styles from '@src/features/workers/components/WorkerFormDialog.module.css';

export interface WorkerFormDialogProps {
  /** Sin worker: "Nuevo trabajador" (POST). Con worker: "Editar trabajador" (PUT). */
  worker?: Worker;
  onClose: () => void;
}

interface FieldErrors {
  name?: string;
  availability?: string;
}

function validate(name: string, availability: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = t('workers.validation.nameRequired');
  const hours = Number(availability);
  if (!/^\d+$/.test(availability.trim()) || hours < 1 || hours > 24) {
    errors.availability = t('workers.validation.availabilityRange');
  }
  return errors;
}

export function WorkerFormDialog({ worker, onClose }: WorkerFormDialogProps) {
  const isEdit = worker !== undefined;
  const toast = useToast();
  const { tasks, assignments } = usePlannerData();
  const createWorker = useCreateWorker();
  const updateWorker = useUpdateWorker();
  const mutation = isEdit ? updateWorker : createWorker;

  const [name, setName] = useState(worker?.name ?? '');
  const [availability, setAvailability] = useState(worker ? String(worker.availability) : '');
  const [skillsText, setSkillsText] = useState(worker ? formatSkills(worker.skills) : '');
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const skills = useMemo(() => parseSkills(skillsText), [skillsText]);
  const errors = submitted ? validate(name, availability) : {};

  // Edición: skills que piden sus tareas asignadas (RN22). Quitar alguna la rechaza la API.
  const required = useMemo(() => {
    if (!worker) return new Map<string, string[]>();
    const byTask = new Map(tasks.map((task) => [task.id, task]));
    const needs = new Map<string, string[]>();
    for (const assignment of assignments) {
      if (assignment.worker_id !== worker.id) continue;
      const task = byTask.get(assignment.task_id);
      if (!task) continue;
      for (const skill of task.skills) needs.set(skill, [...(needs.get(skill) ?? []), task.name]);
    }
    return needs;
  }, [worker, tasks, assignments]);
  const removedNeeded = [...required.keys()].filter((skill) => !skills.includes(skill));

  function apiErrorText(error: unknown, workerName: string, hours: number): string {
    if (isEdit && isApiError(error)) {
      if (error.code === 'MissingSkills') {
        const taskNames = [...new Set(removedNeeded.flatMap((skill) => required.get(skill) ?? []))];
        return removedNeeded.length > 0
          ? t('workers.errors.MissingSkills', {
              skills: formatSkills(removedNeeded),
              worker: workerName,
              tasks: taskNames.map((task) => `«${task}»`).join(', '),
            })
          : t('workers.errors.MissingSkillsGeneric', { worker: workerName });
      }
      if (error.code === 'WorkerBusy') return t('workers.errors.WorkerBusy', { hours, worker: workerName });
    }
    return errorMessage(error, { worker: workerName, name: workerName });
  }

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setApiError(null);
    if (Object.keys(validate(name, availability)).length > 0) return;

    const body = { name: name.trim(), availability: Number(availability), skills };
    try {
      if (worker) {
        await updateWorker.mutateAsync({ id: worker.id, body });
        toast.success(t('workers.toast.updated', { worker: body.name }));
      } else {
        await createWorker.mutateAsync(body);
        toast.success(t('workers.toast.created', { worker: body.name }));
      }
      onClose();
    } catch (error) {
      setApiError(apiErrorText(error, body.name, body.availability));
    }
  }

  const label = isEdit ? t('workers.form.editLabel') : t('workers.form.createLabel');

  return (
    <Dialog
      open
      title={label}
      description={isEdit ? t('workers.form.editDescription') : t('workers.form.createDescription')}
      onClose={onClose}
      busy={mutation.isPending}
    >
      <form aria-label={label} onSubmit={onSubmit} noValidate>
        <FormStack>
          <FormRow>
            <Field label={t('workers.form.name')} error={errors.name}>
              <Input
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('workers.form.namePlaceholder')}
                autoComplete="off"
                maxLength={120}
                required
              />
            </Field>
            <Field
              label={t('workers.form.availability')}
              hint={errors.availability ? undefined : t('workers.form.availabilityHint')}
              error={errors.availability}
            >
              <Input
                name="availability"
                type="number"
                inputMode="numeric"
                min={1}
                max={24}
                step={1}
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
                required
              />
            </Field>
          </FormRow>

          <Field
            label={t('workers.form.skills')}
            hint={
              removedNeeded.length > 0
                ? t('workers.form.neededBy', { skills: formatSkills(removedNeeded) })
                : skills.length === 0
                  ? t('workers.form.skillsHint')
                  : undefined
            }
          >
            <Input
              name="skills"
              value={skillsText}
              onChange={(event) => setSkillsText(event.target.value)}
              placeholder={t('workers.form.skillsPlaceholder')}
              autoComplete="off"
            />
          </Field>

          {(skills.length > 0 || removedNeeded.length > 0) && (
            <ChipList label={t('workers.form.preview')} className={styles.preview}>
              {skills.map((skill) => (
                <li key={skill}>
                  <Chip>{skill}</Chip>
                </li>
              ))}
              {removedNeeded.map((skill) => (
                <li key={`removed-${skill}`}>
                  <Chip tone="missing" className={styles.removed}>
                    {skill}
                  </Chip>
                </li>
              ))}
            </ChipList>
          )}

          <FormError message={apiError} />
        </FormStack>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            {isEdit ? t('workers.form.save') : t('workers.form.create')}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
