import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

import { t } from '@src/i18n/t';
import { IconButton } from '@src/shared/components/IconButton';
import { cx } from '@src/shared/lib/cx';
import styles from '@src/shared/components/Dialog.module.css';

export interface DialogProps {
  open: boolean;
  /** Se llama con Esc, el botón ✕ o un clic en el fondo. El padre decide cerrar (open = false). */
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Botones al pie (alineados a la derecha). Para formularios, mejor dentro del <form> con <DialogFooter>. */
  footer?: ReactNode;
  size?: 'sm' | 'md';
  /** Mientras es true, Esc / fondo / ✕ no cierran (p. ej. guardando) */
  busy?: boolean;
  className?: string;
}

/**
 * Diálogo modal sobre <dialog> nativo: foco atrapado, Esc y top layer gratis.
 * Al abrir enfoca el elemento con `data-autofocus` o, si no hay, el primer campo del formulario;
 * al cerrar el navegador devuelve el foco a quien lo abrió.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  busy = false,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // React no escribe el atributo `autofocus`: usar data-autofocus. Si no hay, el primer campo.
      const target =
        dialog.querySelector<HTMLElement>('[data-autofocus]') ??
        dialog.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled)',
        );
      target?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Si se desmonta abierto, cerrar para liberar el top layer
  useEffect(() => () => ref.current?.close(), []);

  return (
    <dialog
      ref={ref}
      className={cx(styles.dialog, styles[size], className)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Esc: el padre controla el estado
        event.preventDefault();
        if (!busyRef.current) onCloseRef.current();
      }}
      onMouseDown={(event) => {
        // Clic en el fondo (el propio <dialog>, fuera de la caja)
        if (event.target === event.currentTarget && !busyRef.current) {
          const rect = event.currentTarget.getBoundingClientRect();
          const inside =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;
          if (!inside) onCloseRef.current();
        }
      }}
    >
      {open && (
        <div className={styles.box}>
          <header className={styles.header}>
            <div className={styles.heading}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              )}
            </div>
            <IconButton label={t('common.close')} icon={<X />} size="sm" onClick={onClose} disabled={busy} />
          </header>
          {children && <div className={styles.body}>{children}</div>}
          {footer && <DialogFooter>{footer}</DialogFooter>}
        </div>
      )}
    </dialog>
  );
}

/** Pie con los botones de un diálogo (Cancelar a la izquierda de la acción principal) */
export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className={styles.footer}>{children}</div>;
}
