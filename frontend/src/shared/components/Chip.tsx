import type { ReactNode } from 'react';

import { cx } from '@src/shared/lib/cx';
import styles from '@src/shared/components/Chip.module.css';

export interface ChipProps {
  children: ReactNode;
  /** default: skill normal · missing: skill que le falta al trabajador · active: filtro elegido */
  tone?: 'default' | 'missing' | 'active';
  icon?: ReactNode;
  className?: string;
}

/** Etiqueta compacta (skills). Para listas: <ul aria-label=...> con <li><Chip>python</Chip></li>. */
export function Chip({ children, tone = 'default', icon, className }: ChipProps) {
  return (
    <span className={cx(styles.chip, styles[tone], className)}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

/** Lista de chips en línea (semántica de lista, sin viñetas) */
export function ChipList({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul className={cx(styles.list, className)} aria-label={label}>
      {children}
    </ul>
  );
}
