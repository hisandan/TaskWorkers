import { es, type Messages } from '@src/i18n/es';

// Claves válidas como rutas con punto: 'tasks.title', 'tasks.status.done', ...
// Una clave inexistente no compila.
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;

type Params = Record<string, string | number>;

export function t(key: MessageKey, params?: Params): string {
  const message = key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], es) as string;

  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
