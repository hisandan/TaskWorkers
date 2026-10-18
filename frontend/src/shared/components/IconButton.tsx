import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cx } from '@src/shared/lib/cx';
import styles from '@src/shared/components/IconButton.module.css';

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children'
> {
  /** Obligatorio: es el nombre accesible y el tooltip (t('...')) */
  label: string;
  /** Icono de lucide-react: <X /> */
  icon: ReactNode;
  variant?: 'ghost' | 'secondary' | 'danger';
  /** md = 44px (táctil) · sm = 32px (dentro de tarjetas y filas densas) */
  size?: 'sm' | 'md';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'ghost', size = 'md', className, type = 'button', title, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={title ?? label}
      className={cx(styles.button, styles[variant], styles[size], className)}
      {...rest}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    </button>
  );
});
