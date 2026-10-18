/** Une clases de CSS Modules ignorando las falsas: cx(styles.a, active && styles.b) */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
