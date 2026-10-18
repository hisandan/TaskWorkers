// Skills: en la API son listas de texto; en los formularios, texto separado por comas.

/** 'python, SQL,, python ' -> ['python', 'sql'] (minúsculas, sin vacíos ni duplicados, en orden) */
export function parseSkills(text: string): string[] {
  const seen = new Set<string>();
  for (const raw of text.split(',')) {
    const skill = raw.trim().replace(/\s+/g, ' ').toLowerCase();
    if (skill) seen.add(skill);
  }
  return [...seen];
}

/** ['python', 'sql'] -> 'python, sql' (para el valor inicial de un input y para mensajes) */
export function formatSkills(skills: readonly string[]): string {
  return skills.join(', ');
}

/** Skills de la tarea que el trabajador no tiene (RN6). Vacío = puede tomarla (RN7). */
export function missingSkills(
  task: { skills: readonly string[] },
  worker: { skills: readonly string[] },
): string[] {
  const has = new Set(worker.skills.map((s) => s.toLowerCase()));
  return task.skills.filter((skill) => !has.has(skill.toLowerCase()));
}

export function canTake(task: { skills: readonly string[] }, worker: { skills: readonly string[] }): boolean {
  return missingSkills(task, worker).length === 0;
}

/** Todas las skills distintas, ordenadas (para filtros) */
export function allSkills(items: readonly { skills: readonly string[] }[]): string[] {
  return [...new Set(items.flatMap((item) => item.skills))].sort((a, b) => a.localeCompare(b, 'es'));
}
