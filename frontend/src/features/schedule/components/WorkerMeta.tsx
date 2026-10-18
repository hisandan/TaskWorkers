import { CalendarCheck, Clock } from 'lucide-react';
import type { CSSProperties } from 'react';

import type { Worker } from '@src/api/hooks';
import { t } from '@src/i18n/t';
import { Chip, ChipList } from '@src/shared/components';
import { freeFrom, occupancy, type WorkerAgenda } from '@src/shared/lib/agenda';
import { cx } from '@src/shared/lib/cx';
import { formatShortDay, today, type ISODate } from '@src/shared/lib/dates';
import styles from '@src/features/schedule/components/WorkerMeta.module.css';

/** Ocupación en [0, 100] (entero) sobre los días visibles */
export function occupancyPercent(agenda: WorkerAgenda | undefined, days: readonly ISODate[]): number {
  return Math.round(occupancy(agenda, days) * 100);
}

/** "Libre hoy" / "Libre desde jue 22" */
export function freeFromLabel(agenda: WorkerAgenda | undefined): string {
  const now = today();
  if (!agenda) return t('schedule.worker.freeToday');
  const day = freeFrom(agenda, now);
  return day === now
    ? t('schedule.worker.freeToday')
    : t('schedule.worker.freeFrom', { date: formatShortDay(day) });
}

/** Disponibilidad · medidor de ocupación · "Libre desde" (una línea densa) */
export function WorkerStats({
  worker,
  agenda,
  days,
  className,
}: {
  worker: Worker;
  agenda: WorkerAgenda | undefined;
  days: readonly ISODate[];
  className?: string;
}) {
  const percent = occupancyPercent(agenda, days);
  const level = percent >= 90 ? 'high' : percent >= 60 ? 'mid' : 'low';
  return (
    <p className={cx(styles.stats, className)}>
      <span className={styles.stat}>
        <Clock aria-hidden="true" className={styles.icon} />
        {t('common.hoursPerDay', { hours: worker.availability })}
      </span>
      <span
        className={styles.stat}
        title={t('schedule.worker.occupancyLabel', { value: percent })}
        data-level={level}
      >
        <span className={styles.meter} aria-hidden="true" style={{ '--value': `${percent}%` } as CSSProperties}>
          <span className={styles.meterFill} />
        </span>
        <span className="sr-only">{t('schedule.worker.occupancyLabel', { value: percent })}</span>
        <span aria-hidden="true" className={styles.percent}>
          {t('schedule.worker.occupancy', { value: percent })}
        </span>
      </span>
      <span className={styles.stat}>
        <CalendarCheck aria-hidden="true" className={styles.icon} />
        {freeFromLabel(agenda)}
      </span>
    </p>
  );
}

/** Chips de skills (con límite opcional: "+2") o "Sin skills" */
export function WorkerSkills({
  worker,
  max,
  missing = [],
  className,
}: {
  worker: Worker;
  max?: number;
  /** Skills que faltan para la tarea que se arrastra: se agregan en rojo */
  missing?: readonly string[];
  className?: string;
}) {
  const shown = max === undefined ? worker.skills : worker.skills.slice(0, max);
  const hidden = worker.skills.length - shown.length;
  return (
    <ChipList label={t('schedule.worker.skills', { name: worker.name })} className={cx(styles.skills, className)}>
      {missing.length > 0 && (
        <li>
          <Chip tone="missing">{t('schedule.worker.missing', { skills: missing.join(', ') })}</Chip>
        </li>
      )}
      {worker.skills.length === 0 && missing.length === 0 && (
        <li className={styles.noSkills}>{t('schedule.worker.noSkills')}</li>
      )}
      {missing.length === 0 &&
        shown.map((skill) => (
          <li key={skill}>
            <Chip>{skill}</Chip>
          </li>
        ))}
      {missing.length === 0 && hidden > 0 && (
        <li title={worker.skills.slice(shown.length).join(', ')}>
          <Chip>{t('schedule.worker.moreSkills', { count: hidden })}</Chip>
        </li>
      )}
    </ChipList>
  );
}
