import { useState, type ReactNode } from 'react';

import { errorMessage, type ErrorContext } from '@src/api/errors';
import { t } from '@src/i18n/t';
import { Button } from '@src/shared/components/Button';
import { Dialog } from '@src/shared/components/Dialog';
import { FormError } from '@src/shared/components/Field';
import styles from '@src/shared/components/ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  /** Texto del botón; por defecto "Eliminar" */
  confirmLabel?: string;
  /** Por defecto danger (las confirmaciones son para acciones destructivas) */
  tone?: 'danger' | 'primary';
  /** Puede ser async: si lanza, el error se muestra dentro del diálogo con role="alert" */
  onConfirm: () => unknown | Promise<unknown>;
  onClose: () => void;
  /** Nombres para el mensaje de error (errorMessage) */
  errorContext?: ErrorContext;
}

/** Diálogo "Confirmar eliminar". Montarlo solo mientras está abierto. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = 'danger',
  onConfirm,
  onClose,
  errorContext,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(errorMessage(err, errorContext));
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      size="sm"
      title={title}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button variant={tone} onClick={confirm} loading={busy} data-autofocus>
            {confirmLabel ?? t('common.delete')}
          </Button>
        </>
      }
    >
      <p className={styles.message}>{message}</p>
      <FormError message={error} />
    </Dialog>
  );
}
