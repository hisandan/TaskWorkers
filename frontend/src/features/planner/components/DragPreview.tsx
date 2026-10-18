import { GripVertical } from 'lucide-react';

import { t } from '@src/i18n/t';
import { seriesStyle, taskColor } from '@src/shared/lib/colors';
import type { ActiveDrag } from '@src/features/planner/PlannerContext';
import styles from '@src/features/planner/components/DragPreview.module.css';

/** Copia flotante de lo que se arrastra (DragOverlay): nombre, horas y color de la tarea */
export function DragPreview({ drag }: { drag: ActiveDrag }) {
  const task = drag.task;
  return (
    <div className={styles.preview} style={seriesStyle(taskColor(drag.data.taskId))}>
      <GripVertical className={styles.grip} aria-hidden="true" />
      <span className={styles.name}>{task?.name ?? t('planner.dnd.unknownTask')}</span>
      {task && <span className={styles.effort}>{t('common.hours', { hours: task.effort })}</span>}
    </div>
  );
}
