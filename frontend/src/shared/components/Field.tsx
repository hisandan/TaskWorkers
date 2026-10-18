import { AlertCircle } from 'lucide-react';
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { cx } from '@src/shared/lib/cx';
import styles from '@src/shared/components/Field.module.css';

interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

export interface FieldProps {
  /** Texto del <label>: es el nombre accesible del control (el e2e busca por label) */
  label: string;
  /** Ayuda bajo el control */
  hint?: ReactNode;
  /** Error de validación del campo (marca aria-invalid) */
  error?: string | null;
  /** Un solo control: <Input />, <Select /> o <Textarea /> */
  children: ReactNode;
  className?: string;
}

/**
 * Agrupa label + control + ayuda + error y los asocia (htmlFor / aria-describedby / aria-invalid).
 *   <Field label={t('tasks.form.name')} error={errors.name}><Input name="name" required /></Field>
 */
export function Field({ label, hint, error, children, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cx(styles.field, className)}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {children}
        {hint && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className={styles.error}>
            <AlertCircle aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

function useFieldProps(props: { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: unknown }) {
  const field = useContext(FieldContext);
  return {
    id: props.id ?? field?.id,
    'aria-describedby': props['aria-describedby'] ?? field?.describedBy,
    'aria-invalid': (props['aria-invalid'] as boolean | undefined) ?? (field?.invalid || undefined),
  };
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cx(styles.control, className)} {...props} {...useFieldProps(props)} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cx(styles.control, styles.select, className)}
      {...props}
      {...useFieldProps(props)}
    >
      {children}
    </select>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cx(styles.control, styles.textarea, className)}
        {...props}
        {...useFieldProps(props)}
      />
    );
  },
);

/**
 * Error de la API dentro de un formulario o diálogo: <p role="alert"> (contrato del e2e).
 * No renderiza nada si no hay mensaje. Fuera de diálogos usar toasts (useToast).
 */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className={styles.formError}>
      <AlertCircle aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

/** Columna de campos con el espaciado estándar de un formulario */
export function FormStack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}

/** Fila de campos (se apila en pantallas angostas) */
export function FormRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
