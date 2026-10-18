import type { ReactNode } from 'react';

import { cx } from '@src/shared/lib/cx';
import styles from '@src/shared/components/EmptyState.module.css';

export interface EmptyStateProps {
  /** Icono de lucide-react: <Inbox /> */
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Botón u otra acción: <Button size="sm">...</Button> */
  action?: ReactNode;
  /** compact: dentro de listas y celdas */
  size?: 'md' | 'compact';
  className?: string;
}

export function EmptyState({ icon, title, description, action, size = 'md', className }: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, styles[size], className)}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
