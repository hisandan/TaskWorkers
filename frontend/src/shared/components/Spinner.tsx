import { t } from '@src/i18n/t';
import { cx } from '@src/shared/lib/cx';
import styles from '@src/shared/components/Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Texto para lectores de pantalla; por defecto "Cargando..." */
  label?: string;
  /** Solo decorativo (p. ej. dentro de un botón con aria-busy) */
  decorative?: boolean;
  className?: string;
}

export function Spinner({ size = 'md', label, decorative = false, className }: SpinnerProps) {
  return (
    <span
      className={cx(styles.spinner, styles[size], className)}
      role={decorative ? undefined : 'status'}
      aria-hidden={decorative || undefined}
    >
      {!decorative && <span className="sr-only">{label ?? t('common.loading')}</span>}
    </span>
  );
}

export interface SkeletonProps {
  /** Ancho CSS con token o porcentaje: 'var(--space-16)' | '60%' */
  width?: string;
  height?: string;
  radius?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

/** Bloque gris animado mientras cargan los datos (aria-hidden: acompañar con un Spinner o aria-busy) */
export function Skeleton({
  width = '100%',
  height = 'var(--space-4)',
  radius = 'sm',
  className,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(styles.skeleton, styles[`radius-${radius}`], className)}
      style={{ width, height }}
    />
  );
}
