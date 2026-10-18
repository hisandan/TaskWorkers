// Fechas de calendario como texto ISO 'YYYY-MM-DD' (igual que la API).
//
// Regla: una fecha de calendario NO es un instante. Siempre se arma y se lee en hora LOCAL
// (new Date(y, m - 1, d) y format(...)), nunca con toISOString() ni new Date('YYYY-MM-DD'),
// que usan UTC y en Colombia (UTC-5) corren el día.
// Los ISO se comparan como texto: '2026-10-19' < '2026-10-20'.

import {
  addDays as addDaysFns,
  differenceInCalendarDays,
  format,
  isWeekend as isWeekendFns,
  startOfWeek,
} from 'date-fns';
import { es as esLocale } from 'date-fns/locale';

import { t } from '@src/i18n/t';

/** 'YYYY-MM-DD' */
export type ISODate = string;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(value: unknown): value is ISODate {
  return typeof value === 'string' && ISO_RE.test(value) && !Number.isNaN(parseISODate(value).getTime());
}

/** Date local a medianoche (sin zona horaria de por medio) */
export function parseISODate(iso: ISODate): Date {
  const match = ISO_RE.exec(iso);
  if (!match) return new Date(Number.NaN);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Date -> 'YYYY-MM-DD' con los componentes LOCALES */
export function toISODate(date: Date): ISODate {
  return format(date, 'yyyy-MM-dd');
}

export function today(): ISODate {
  return toISODate(new Date());
}

export function addDays(iso: ISODate, days: number): ISODate {
  return toISODate(addDaysFns(parseISODate(iso), days));
}

export function addWeeks(iso: ISODate, weeks: number): ISODate {
  return addDays(iso, weeks * 7);
}

/** Días de calendario de `from` a `to` (negativo si `to` es anterior) */
export function daysBetween(from: ISODate, to: ISODate): number {
  return differenceInCalendarDays(parseISODate(to), parseISODate(from));
}

export function isWeekend(iso: ISODate): boolean {
  return isWeekendFns(parseISODate(iso));
}

/** Lunes a viernes (RN12, RN13). No hay festivos. */
export function isBusinessDay(iso: ISODate): boolean {
  return !isWeekend(iso);
}

/** El mismo día si es hábil; si cae en fin de semana, el lunes siguiente (rules.business_day) */
export function nextBusinessDay(iso: ISODate): ISODate {
  let day = iso;
  while (isWeekend(day)) day = addDays(day, 1);
  return day;
}

/** Suma `count` días hábiles (negativo resta). Desde un fin de semana cuenta desde el lunes/viernes. */
export function addBusinessDays(iso: ISODate, count: number): ISODate {
  const step = count < 0 ? -1 : 1;
  let day = iso;
  let left = Math.abs(count);
  while (left > 0) {
    day = addDays(day, step);
    if (isBusinessDay(day)) left -= 1;
  }
  return day;
}

/** Lunes de la semana de `iso` (semanas de lunes a domingo) */
export function mondayOf(iso: ISODate): ISODate {
  return toISODate(startOfWeek(parseISODate(iso), { weekStartsOn: 1 }));
}

/** Semana que se muestra por defecto: la de hoy; en fin de semana, la siguiente (la actual ya terminó) */
export function currentWeek(): ISODate {
  return mondayOf(nextBusinessDay(today()));
}

/** `count` días seguidos desde `start` (incluye fines de semana) */
export function dayRange(start: ISODate, count: number): ISODate[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

/** Solo los días hábiles de `weeks` semanas desde el lunes de `start` (vista Equipo: 3 semanas = 15 días) */
export function businessDaysOfWeeks(start: ISODate, weeks: number): ISODate[] {
  return dayRange(mondayOf(start), weeks * 7).filter(isBusinessDay);
}

export function isToday(iso: ISODate): boolean {
  return iso === today();
}

/** Antes de hoy (no se puede iniciar una asignación ahí, RN11) */
export function isPast(iso: ISODate): boolean {
  return iso < today();
}

/** Día válido para soltar o iniciar una asignación: hábil y no pasado */
export function isSchedulableDay(iso: ISODate): boolean {
  return isBusinessDay(iso) && !isPast(iso);
}

// ---------------------------------------------------------------------------
// Formato (español). Los patrones viven en i18n (dates.*)
// ---------------------------------------------------------------------------

function fmt(iso: ISODate, pattern: string): string {
  return format(parseISODate(iso), pattern, { locale: esLocale }).replace('.', '');
}

/** 'lun 19' */
export function formatShortDay(iso: ISODate): string {
  return fmt(iso, t('dates.shortDay'));
}

/** 'lunes 19 de octubre' */
export function formatLongDay(iso: ISODate): string {
  return fmt(iso, t('dates.longDay'));
}

/** '19 oct' */
export function formatDayMonth(iso: ISODate): string {
  return fmt(iso, t('dates.dayMonth'));
}

/** 'L', 'M', ... (encabezados angostos) */
export function formatWeekdayLetter(iso: ISODate): string {
  return fmt(iso, t('dates.weekday')).toUpperCase();
}

/** 'lun 19 → mar 20' (un solo día: 'lun 19') */
export function formatDayRange(from: ISODate, to: ISODate): string {
  if (from === to) return formatShortDay(from);
  return t('dates.range', { from: formatShortDay(from), to: formatShortDay(to) });
}

/** '19 oct – 6 nov' */
export function formatWeekRange(from: ISODate, to: ISODate): string {
  return t('dates.weekRange', { from: formatDayMonth(from), to: formatDayMonth(to) });
}
