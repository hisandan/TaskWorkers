import { useRef, type KeyboardEvent, type ReactNode } from 'react';

import { cx } from '@src/shared/lib/cx';
import styles from '@src/shared/components/Tabs.module.css';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  /** Número al lado del texto: "Por asignar (3)" */
  count?: number;
  icon?: ReactNode;
}

export interface TabsProps<T extends string> {
  /** Nombre del grupo (aria-label del tablist) */
  label: string;
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Prefijo único para ids: los paneles usan tabPanelProps(idPrefix, value) */
  idPrefix: string;
  /** tabs: subrayado (navegación de vistas) · segmented: botones unidos (filtros compactos) */
  variant?: 'tabs' | 'segmented';
  size?: 'sm' | 'md';
  className?: string;
}

export const tabId = (prefix: string, value: string) => `${prefix}-tab-${value}`;
export const tabPanelId = (prefix: string, value: string) => `${prefix}-panel-${value}`;

/** Props del panel de la pestaña activa: <div {...tabPanelProps('tasks', tab)}> */
export function tabPanelProps(prefix: string, value: string) {
  return {
    role: 'tabpanel' as const,
    id: tabPanelId(prefix, value),
    'aria-labelledby': tabId(prefix, value),
    tabIndex: 0,
  };
}

/**
 * Pestañas accesibles (patrón WAI-ARIA tabs, activación automática):
 * flechas izquierda/derecha, Inicio y Fin; solo la activa entra en el orden de Tab.
 */
export function Tabs<T extends string>({
  label,
  items,
  value,
  onChange,
  idPrefix,
  variant = 'tabs',
  size = 'md',
  className,
}: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.value === value);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    onChange(items[next].value);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      className={cx(styles.list, styles[variant], styles[size], className)}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={tabId(idPrefix, item.value)}
            aria-selected={selected}
            aria-controls={tabPanelId(idPrefix, item.value)}
            tabIndex={selected ? 0 : -1}
            className={styles.tab}
            onClick={() => onChange(item.value)}
          >
            {item.icon && (
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
            {item.count !== undefined && <span className={styles.count}>{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Igual que Tabs, con estilo de control segmentado */
export function Segmented<T extends string>(props: Omit<TabsProps<T>, 'variant'>) {
  return <Tabs {...props} variant="segmented" />;
}
