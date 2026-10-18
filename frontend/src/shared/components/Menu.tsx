import { MoreHorizontal } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { t } from '@src/i18n/t';
import { IconButton } from '@src/shared/components/IconButton';
import { cx } from '@src/shared/lib/cx';
import styles from '@src/shared/components/Menu.module.css';

export interface MenuItem {
  /** Clave estable para React */
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Acción destructiva (rojo) */
  danger?: boolean;
  disabled?: boolean;
  /** Línea separadora antes del ítem */
  separated?: boolean;
}

export interface MenuProps {
  items: readonly (MenuItem | false | null | undefined)[];
  /** Nombre accesible del botón ⋯; por defecto "Más acciones". Mejor concreto: "Acciones de API" */
  label?: string;
  size?: 'sm' | 'md';
  /** Alineación del menú respecto del botón */
  align?: 'start' | 'end';
  className?: string;
}

/**
 * Botón ⋯ con un menú de acciones (patrón menu button).
 * - Usa `popover` nativo: top layer (no lo recortan contenedores con overflow), cierre con Esc y clic afuera.
 * - Flechas arriba/abajo, Inicio/Fin; Enter o espacio ejecuta; el foco vuelve al botón.
 * - Detiene pointerdown/click para no disparar el arrastre ni el clic de la tarjeta o fila que lo contiene.
 */
export function Menu({ items, label, size = 'sm', align = 'end', className }: MenuProps) {
  const visible = items.filter((item): item is MenuItem => Boolean(item));
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  function place() {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const gap = 4;
    let left = align === 'end' ? rect.right - width : rect.left;
    left = Math.max(gap, Math.min(left, window.innerWidth - width - gap));
    let top = rect.bottom + gap;
    if (top + height > window.innerHeight - gap) top = Math.max(gap, rect.top - height - gap);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  function focusItem(index: number) {
    const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)');
    if (!buttons?.length) return;
    buttons[(index + buttons.length) % buttons.length]?.focus();
  }

  // A qué ítem va el foco al abrir (flecha arriba abre en el último)
  const focusOnOpen = useRef<'first' | 'last'>('first');

  function show(focus: 'first' | 'last' = 'first') {
    const menu = menuRef.current;
    focusOnOpen.current = focus;
    if (menu && !menu.matches(':popover-open')) menu.showPopover();
  }

  function hide(returnFocus = true) {
    const menu = menuRef.current;
    if (menu?.matches(':popover-open')) menu.hidePopover();
    if (returnFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const onToggle = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === 'open';
      setOpen(isOpen);
      if (isOpen) {
        place();
        focusItem(focusOnOpen.current === 'first' ? 0 : -1);
        focusOnOpen.current = 'first';
      }
    };
    menu.addEventListener('toggle', onToggle);
    return () => menu.removeEventListener('toggle', onToggle);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Al hacer scroll o cambiar el tamaño, el botón se mueve: se cierra (como los menús nativos)
    const close = () => hide(false);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = [
      ...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []),
    ];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowDown') focusItem(index + 1);
    else if (event.key === 'ArrowUp') focusItem(index - 1);
    else if (event.key === 'Home') focusItem(0);
    else if (event.key === 'End') focusItem(-1);
    else if (event.key === 'Tab') hide(false);
    else if (event.key === 'Escape') hide();
    else return;
    event.preventDefault();
    event.stopPropagation();
  }

  if (visible.length === 0) return null;

  return (
    <span
      className={cx(styles.root, className)}
      // No iniciar drag (dnd-kit escucha pointerdown) ni clics del contenedor
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <IconButton
        ref={triggerRef}
        label={label ?? t('common.moreActions')}
        icon={<MoreHorizontal />}
        size={size}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        // popoverTarget: el navegador abre/cierra y no lo trata como "clic afuera"
        popoverTarget={menuId}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            show('first');
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            show('last');
          }
        }}
      />
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        aria-label={label ?? t('common.moreActions')}
        className={styles.menu}
        onKeyDown={onMenuKeyDown}
      >
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            tabIndex={-1}
            disabled={item.disabled}
            className={cx(styles.item, item.danger && styles.danger, item.separated && styles.separated)}
            onClick={() => {
              hide();
              item.onSelect();
            }}
          >
            {item.icon && (
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
            )}
            {item.label}
          </button>
        ))}
      </div>
    </span>
  );
}
