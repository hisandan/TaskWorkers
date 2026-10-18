import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { Spinner } from '@src/shared/components/Spinner';
import { cx } from '@src/shared/lib/cx';
import styles from '@src/shared/components/Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: acción principal (una por zona) · secondary: por defecto · ghost: discreta · danger: destructiva */
  variant?: ButtonVariant;
  /** md = 44px (objetivo táctil, acciones principales) · sm = 32px (zonas densas) */
  size?: ButtonSize;
  /** Icono de lucide-react ya instanciado: <Plus /> (se le agrega aria-hidden) */
  icon?: ReactNode;
  iconEnd?: ReactNode;
  /** Deshabilita y muestra un spinner en lugar del icono */
  loading?: boolean;
  /** Ocupa todo el ancho disponible */
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    icon,
    iconEnd,
    loading = false,
    block = false,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(styles.button, styles[variant], styles[size], block && styles.block, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" decorative />
      ) : (
        icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )
      )}
      {children && <span className={styles.label}>{children}</span>}
      {iconEnd && (
        <span className={styles.icon} aria-hidden="true">
          {iconEnd}
        </span>
      )}
    </button>
  );
});
