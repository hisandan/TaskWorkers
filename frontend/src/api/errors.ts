// Errores de la API normalizados y su traducción a textos de i18n.
//
// - Dominio: { detail: string, code: string } con code = nombre del error (MissingSkills, ...): 404/409/422.
// - Validación de Pydantic: 422 con `detail` como lista -> mensaje genérico de datos inválidos.
// - Red caída o proxy sin backend: status 0 -> mensaje de red.

import { t, type MessageKey } from '@src/i18n/t';

export const DOMAIN_ERROR_CODES = [
  'MissingSkills',
  'TaskDone',
  'TaskAlreadyAssigned',
  'WorkerBusy',
  'HasAssignments',
  'StartInPast',
  'StartNotBusinessDay',
  'TaskNotFound',
  'WorkerNotFound',
  'AssignmentNotFound',
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

/** Códigos propios del frontend para lo que no es un error de dominio */
export type ApiErrorCode = DomainErrorCode | 'Validation' | 'Network' | 'Unknown';

export class ApiError extends Error {
  /** HTTP status; 0 si no hubo respuesta (red) */
  readonly status: number;
  readonly code: ApiErrorCode;
  /** Texto crudo del backend (en español, pensado para logs; para la UI usar errorMessage) */
  readonly detail: string;

  constructor(status: number, code: ApiErrorCode, detail: string) {
    super(detail || code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }

  /** Arma un ApiError desde el cuerpo de una respuesta con error */
  static fromResponse(status: number, body: unknown): ApiError {
    const payload = (body ?? {}) as { detail?: unknown; code?: unknown };
    if (isDomainCode(payload.code)) {
      return new ApiError(status, payload.code, String(payload.detail ?? ''));
    }
    if (status === 422 && Array.isArray(payload.detail)) {
      // Pydantic: [{ loc, msg, type }, ...]
      const detail = payload.detail
        .map((item: { msg?: string }) => item?.msg)
        .filter(Boolean)
        .join('; ');
      return new ApiError(status, 'Validation', detail);
    }
    const detail = typeof payload.detail === 'string' ? payload.detail : '';
    return new ApiError(status, 'Unknown', detail);
  }

  static network(cause: unknown): ApiError {
    const error = new ApiError(0, 'Network', cause instanceof Error ? cause.message : String(cause));
    error.cause = cause;
    return error;
  }

  isDomain(code?: DomainErrorCode): boolean {
    return code ? this.code === code : isDomainCode(this.code);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isDomainCode(code: unknown): code is DomainErrorCode {
  return typeof code === 'string' && (DOMAIN_ERROR_CODES as readonly string[]).includes(code);
}

/**
 * Datos opcionales para un mensaje más concreto. Si el mensaje "con nombres" necesita un dato
 * que no se pasó, se usa el genérico del código: nunca queda un '{task}' sin reemplazar.
 */
export interface ErrorContext {
  /** Nombre de la tarea involucrada */
  task?: string;
  /** Nombre del trabajador involucrado */
  worker?: string;
  /** Nombre de lo que se intenta eliminar (HasAssignments); si falta usa task o worker */
  name?: string;
  /** Skills que faltan, ya formateadas ('sql, rust'); ver shared/lib/skills.ts */
  missing?: string;
}

/** Texto en español para mostrar un error (toast o <p role="alert"> de un diálogo). */
export function errorMessage(error: unknown, ctx: ErrorContext = {}): string {
  if (!isApiError(error)) return t('errors.generic');

  switch (error.code) {
    case 'Network':
      return t('errors.network');
    case 'Validation':
      return t('errors.validation');
    case 'Unknown':
      if (error.status === 404) return t('errors.notFound');
      if (error.status === 422) return t('errors.validation');
      if (error.status >= 500) return t('errors.server', { status: error.status });
      return t('errors.generic');
  }

  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries({ ...ctx, name: ctx.name ?? ctx.task ?? ctx.worker })) {
    if (value) params[key] = value;
  }

  // Del más detallado al genérico: el primero cuyos {datos} estén todos disponibles
  const candidates = [
    `errors.detailed.${error.code}`,
    `errors.named.${error.code}`,
    `errors.codes.${error.code}`,
  ];
  for (const key of candidates) {
    if (!hasMessage(key)) continue;
    const message = t(key, params);
    if (!/\{\w+\}/.test(message)) return message;
  }
  return t('errors.generic');
}

function hasMessage(key: string): key is MessageKey {
  try {
    return typeof t(key as MessageKey) === 'string';
  } catch {
    return false;
  }
}
