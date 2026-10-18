import type { ReactNode } from 'react';

import { cx } from '@src/shared/lib/cx';
import styles from '@src/shared/components/Badge.module.css';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  /** El estado nunca va solo con color: icono + texto */
  tone?: BadgeTone;
  /** Icono de lucide-react: <CheckCircle2 /> (aria-hidden automático) */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: string;
}

/** Píldora de estado: <Badge tone="success" icon={<CheckCircle2 />}>{t('tasks.status.done')}</Badge> */
export function Badge({ tone = 'neutral', icon, children, className, title }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone], className)} title={title}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
