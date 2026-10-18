import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * false en el render del servidor y durante la hidratación; true después, en el navegador.
 * Sirve para no renderizar en SSR lo que depende de la fecha de hoy, la URL o el storage
 * (evita diferencias de hidratación con client:load).
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
