// Resultado de POST /assignments/auto (el Planner ya llamó a la API y abrió este diálogo).
// Listas con aria-label "Asignadas" y "Sin asignar": contrato del e2e (ESC-36).
import { ArrowRight, CheckCircle2, CircleSlash } from 'lucide-react';

import type { AutoAssignResult, Task, Worker } from '@src/api/hooks';
import { usePlanner, usePlannerData } from '@src/features/planner';
import { t } from '@src/i18n/t';
import { Avatar, Button, Dialog, DialogFooter } from '@src/shared/components';
import { seriesStyle, taskColor } from '@src/shared/lib/colors';
import { formatDayRange } from '@src/shared/lib/dates';
import { formatSkills, missingSkills } from '@src/shared/lib/skills';
import styles from '@src/features/assignments/components/AutoAssignResultDialog.module.css';

export interface AutoAssignResultDialogProps {
  /** Respuesta de POST /assignments/auto (el Planner ya la pidió) */
  result: AutoAssignResult;
  onClose: () => void;
}

/** Por qué quedó sin asignar: la única causa es que nadie cumple sus skills (RN21) */
function unassignedReason(task: Task, workers: readonly Worker[]): string {
  if (workers.length === 0) return t('assignments.auto.reasonNoWorkers');
  const owned = new Set(workers.flatMap((worker) => worker.skills.map((s) => s.toLowerCase())));
  const nobody = task.skills.filter((skill) => !owned.has(skill.toLowerCase()));
  if (nobody.length > 0) return t('assignments.auto.reasonNobody', { skills: formatSkills(nobody) });
  // Cada skill la tiene alguien, pero nadie las tiene todas
  const closest = Math.min(...workers.map((worker) => missingSkills(task, worker).length));
  if (closest > 0) return t('assignments.auto.reasonCombination', { skills: formatSkills(task.skills) });
  return t('assignments.auto.reasonUnknown');
}

export function AutoAssignResultDialog({ result, onClose }: AutoAssignResultDialogProps) {
  const { openWorker } = usePlanner();
  const { taskById, workerById, workers } = usePlannerData();
  const { assigned, unassigned } = result;
  const nothing = assigned.length === 0 && unassigned.length === 0;

  const assignedSorted = [...assigned].sort((a, b) =>
    a.start_date === b.start_date ? a.id - b.id : a.start_date < b.start_date ? -1 : 1,
  );

  return (
    <Dialog
      open
      title={t('assignments.auto.title')}
      description={t('assignments.auto.summary', {
        assigned: assigned.length,
        unassigned: unassigned.length,
      })}
      onClose={onClose}
    >
      {nothing ? (
        <p className={styles.muted}>{t('assignments.auto.nothingPending')}</p>
      ) : (
        <div className={styles.sections}>
          <section className={styles.section}>
            <h3 className={styles.heading}>
              <CheckCircle2 aria-hidden="true" className={styles.okIcon} />
              {t('assignments.auto.assignedTitle')}
              <span className={styles.count}>{assigned.length}</span>
            </h3>
            {assigned.length === 0 ? (
              <p className={styles.muted}>{t('assignments.auto.noneAssigned')}</p>
            ) : (
              <ul className={styles.list} aria-label={t('assignments.auto.assignedList')}>
                {assignedSorted.map((assignment) => {
                  const task = taskById.get(assignment.task_id);
                  const worker = workerById.get(assignment.worker_id);
                  const taskName = task?.name ?? t('common.none');
                  const workerName = worker?.name ?? t('common.none');
                  return (
                    <li key={assignment.id}>
                      <button
                        type="button"
                        className={styles.item}
                        style={seriesStyle(taskColor(assignment.task_id))}
                        title={t('assignments.auto.openCalendar', { worker: workerName })}
                        onClick={() => {
                          onClose();
                          openWorker(assignment.worker_id, assignment.start_date, assignment.id);
                        }}
                      >
                        <span className={styles.task}>{taskName}</span>
                        <ArrowRight aria-hidden="true" className={styles.arrow} />
                        <span className={styles.worker}>
                          <Avatar name={workerName} id={assignment.worker_id} size="sm" />
                          {workerName}
                        </span>
                        <span className={styles.dates}>
                          {formatDayRange(assignment.start_date, assignment.end_date)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={styles.section}>
            <h3 className={styles.heading}>
              <CircleSlash aria-hidden="true" className={styles.warnIcon} />
              {t('assignments.auto.unassignedTitle')}
              <span className={styles.count}>{unassigned.length}</span>
            </h3>
            {unassigned.length === 0 ? (
              <p className={styles.muted}>{t('assignments.auto.noneUnassigned')}</p>
            ) : (
              <ul className={styles.list} aria-label={t('assignments.auto.unassignedList')}>
                {unassigned.map((task) => (
                  <li key={task.id} className={styles.unassigned}>
                    <span className={styles.task}>{task.name}</span>
                    <span className={styles.reason}>{unassignedReason(task, workers)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <DialogFooter>
        <Button variant="primary" onClick={onClose} data-autofocus>
          {t('assignments.auto.close')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
