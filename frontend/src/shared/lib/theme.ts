// Modo claro/oscuro: se guarda en localStorage y se aplica como data-theme en <html>.
// Sin preferencia guardada, manda el sistema operativo (ver styles/tokens/theme.css).
// OJO: el script inline de BaseLayout repite THEME_STORAGE_KEY para evitar el parpadeo inicial.

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

export function getTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  if (attr === 'light' || attr === 'dark') return attr;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Modo privado o storage bloqueado: el tema aplica solo a esta visita
  }
}

export function toggleTheme(): Theme {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
