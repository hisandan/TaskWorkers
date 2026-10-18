import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { t } from '@src/i18n/t';
import { cx } from '@src/shared/lib/cx';
import styles from '@src/shared/components/Toaster.module.css';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastOptions {
  tone?: ToastTone;
  message: string;
  /** Línea secundaria opcional */
  description?: string;
  /** ms antes de cerrarse solo; por defecto 4 s (éxito/info) y 7 s (error). 0 = no se cierra solo */
  duration?: number;
}

interface Toast extends Required<Omit<ToastOptions, 'description'>> {
  id: number;
  description?: string;
}

export interface ToastApi {
  show: (options: ToastOptions) => number;
  success: (message: string, description?: string) => number;
  error: (message: string, description?: string) => number;
  info: (message: string, description?: string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const MAX_TOASTS = 4;
const DEFAULT_DURATION: Record<ToastTone, number> = { success: 4000, info: 4000, error: 7000 };

/**
 * Avisos flotantes. El provider va en el Planner; los componentes usan useToast():
 *   const toast = useToast();
 *   toast.error(errorMessage(err, { task: task.name }));
 * Errores con role="alert" (los anuncia el lector y los ve el e2e); el resto con role="status".
 * Dentro de un diálogo NO usar toasts: el error va en <FormError> (un solo role="alert" visible).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const tone = options.tone ?? 'info';
    const id = ++nextId.current;
    const toast: Toast = {
      id,
      tone,
      message: options.message,
      description: options.description,
      duration: options.duration ?? DEFAULT_DURATION[tone],
    };
    setToasts((list) => [...list, toast].slice(-MAX_TOASTS));
    return id;
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (message, description) => show({ tone: 'success', message, description }),
      error: (message, description) => show({ tone: 'error', message, description }),
      info: (message, description) => show({ tone: 'info', message, description }),
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <section className={styles.region} aria-label={t('common.notifications')}>
        <ol className={styles.list}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </ol>
      </section>
    </ToastContext.Provider>
  );
}

const ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 />,
  error: <AlertCircle />,
  info: <Info />,
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!toast.duration || paused) return;
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, paused, onDismiss]);

  return (
    <li
      className={cx(styles.toast, styles[toast.tone])}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className={styles.icon} aria-hidden="true">
        {ICONS[toast.tone]}
      </span>
      <div className={styles.text}>
        <p className={styles.message}>{toast.message}</p>
        {toast.description && <p className={styles.description}>{toast.description}</p>}
      </div>
      <button
        type="button"
        className={styles.close}
        aria-label={t('common.dismiss')}
        onClick={() => onDismiss(toast.id)}
      >
        <X aria-hidden="true" />
      </button>
    </li>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast() necesita <ToastProvider> (lo pone el Planner)');
  return api;
}
