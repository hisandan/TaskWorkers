import { ChevronLeft, ChevronRight } from 'lucide-react';

import { t } from '@src/i18n/t';
import { Button, IconButton } from '@src/shared/components';
import { addDays, currentWeek, formatWeekRange } from '@src/shared/lib/dates';
import { usePlanner } from '@src/features/planner/PlannerContext';
import { CALENDAR_WEEKS, TEAM_WEEKS } from '@src/features/planner/usePlannerState';
import styles from '@src/features/planner/components/WeekNav.module.css';

/** [◀] [Hoy] [▶]  19 oct – 6 nov  (lunes a viernes de las semanas visibles: Equipo o calendario) */
export function WeekNav() {
  const { week, workerId, shiftWeeks, goToday } = usePlanner();
  const isCurrent = week === currentWeek();
  const weeks = workerId === null ? TEAM_WEEKS : CALENDAR_WEEKS;
  const lastFriday = addDays(week, weeks * 7 - 3);

  return (
    <div className={styles.nav} role="group" aria-label={t('planner.week.label')}>
      <IconButton
        label={t('planner.week.previous')}
        icon={<ChevronLeft />}
        size="sm"
        variant="secondary"
        onClick={() => shiftWeeks(-1)}
      />
      <Button size="sm" variant="secondary" onClick={goToday} disabled={isCurrent}>
        {t('planner.week.today')}
      </Button>
      <IconButton
        label={t('planner.week.next')}
        icon={<ChevronRight />}
        size="sm"
        variant="secondary"
        onClick={() => shiftWeeks(1)}
      />
      <span className={styles.range} aria-live="polite">
        {formatWeekRange(week, lastFriday)}
      </span>
    </div>
  );
}
