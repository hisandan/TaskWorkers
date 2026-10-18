import { cx } from '@src/shared/lib/cx';
import { seriesStyle, workerColor } from '@src/shared/lib/colors';
import styles from '@src/shared/components/Avatar.module.css';

export interface AvatarProps {
  /** Nombre completo: se muestran sus iniciales */
  name: string;
  /** Id del trabajador: define su color de serie (shared/lib/colors.ts) */
  id: number;
  size?: 'sm' | 'md';
  /** Si el nombre ya está al lado, el avatar es decorativo (por defecto) */
  decorative?: boolean;
  className?: string;
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1 ? [words[0][0], words[words.length - 1][0]] : [...(words[0] ?? '')].slice(0, 2);
  return letters.join('').toUpperCase();
}

export function Avatar({ name, id, size = 'md', decorative = true, className }: AvatarProps) {
  return (
    <span
      className={cx(styles.avatar, styles[size], className)}
      style={seriesStyle(workerColor(id))}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
