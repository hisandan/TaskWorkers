// Colores categóricos de trabajadores y tareas: --color-series-1..8 (styles/tokens/theme.css).
// Trabajador: series[(id - 1) % 8]. Tarea: series[(taskId - 1) % 8]. El color es estable por id.

import type { CSSProperties } from 'react';

export const SERIES_COUNT = 8;

export interface SeriesColor {
  /** 1..8 */
  index: number;
  /** 'var(--color-series-N)': borde, barra o texto sobre `soft` */
  color: string;
  /** 'var(--color-series-N-soft)': fondo */
  soft: string;
}

export function seriesIndex(id: number): number {
  return ((((id - 1) % SERIES_COUNT) + SERIES_COUNT) % SERIES_COUNT) + 1;
}

export function seriesColor(id: number): SeriesColor {
  const index = seriesIndex(id);
  return { index, color: `var(--color-series-${index})`, soft: `var(--color-series-${index}-soft)` };
}

export const workerColor = seriesColor;
export const taskColor = seriesColor;

/**
 * Variables CSS para un elemento: en su .module.css usar var(--series) y var(--series-soft).
 *   <div style={seriesStyle(workerColor(worker.id))} className={styles.block} />
 */
export function seriesStyle(series: SeriesColor): CSSProperties {
  return { '--series': series.color, '--series-soft': series.soft } as CSSProperties;
}
