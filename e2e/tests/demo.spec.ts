import { expect, test, type Page } from "@playwright/test";

/**
 * Flujos de la demo (docs/testing/bdd.md §8). Corren sobre los datos de `make seed`.
 *
 * Contrato de la interfaz que estos tests esperan:
 * - Formularios con aria-label "Nuevo trabajador", "Nueva tarea" y "Asignar tarea".
 * - Campos por label: Nombre, Disponibilidad, Esfuerzo, Skills (separadas por coma), Tarea, Trabajador, Inicio.
 * - Tabla con aria-label "Asignaciones": una fila por asignación con tarea, trabajador, inicio y fin (YYYY-MM-DD).
 * - Errores de la API en un elemento con role="alert".
 * - Botón "Auto-asignar"; el resultado en listas con aria-label "Asignadas" y "Sin asignar".
 */

// Nombres únicos por corrida: los tests no chocan con el seed ni con corridas anteriores
const uid = () => Date.now().toString(36);

const iso = (d: Date) => d.toISOString().slice(0, 10);

function nextMonday(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + (((8 - d.getUTCDay()) % 7) || 7));
  return d;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

async function createWorker(page: Page, name: string, availability: number, skills: string) {
  const form = page.getByRole("form", { name: "Nuevo trabajador" });
  await form.getByLabel("Nombre").fill(name);
  await form.getByLabel("Disponibilidad").fill(String(availability));
  await form.getByLabel("Skills").fill(skills);
  await form.getByRole("button", { name: "Crear" }).click();
}

async function createTask(page: Page, name: string, effort: number, skills: string) {
  const form = page.getByRole("form", { name: "Nueva tarea" });
  await form.getByLabel("Nombre").fill(name);
  await form.getByLabel("Esfuerzo").fill(String(effort));
  await form.getByLabel("Skills").fill(skills);
  await form.getByRole("button", { name: "Crear" }).click();
}

async function assignTask(page: Page, task: string, worker: string, start: Date) {
  const form = page.getByRole("form", { name: "Asignar tarea" });
  await form.getByLabel("Tarea").selectOption({ label: task });
  await form.getByLabel("Trabajador").selectOption({ label: worker });
  await form.getByLabel("Inicio").fill(iso(start));
  await form.getByRole("button", { name: "Asignar" }).click();
}

const assignmentRow = (page: Page, task: string) =>
  page.getByRole("table", { name: "Asignaciones" }).getByRole("row").filter({ hasText: task });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("ESC-34 crear, asignar y ver fechas", async ({ page }) => {
  const worker = `Ana ${uid()}`;
  const task = `API ${uid()}`;
  const monday = nextMonday();

  await createWorker(page, worker, 6, "python");
  await createTask(page, task, 10, "python");
  await assignTask(page, task, worker, monday);

  // 10 h a 6 h/día: lunes 6 h + martes 4 h
  const row = assignmentRow(page, task);
  await expect(row).toContainText(worker);
  await expect(row).toContainText(iso(monday));
  await expect(row).toContainText(iso(addDays(monday, 1)));
});

test("ESC-35 la interfaz muestra por qué se rechaza una asignación", async ({ page }) => {
  const worker = `Ana ${uid()}`;
  const task = `Reportes ${uid()}`;

  await createWorker(page, worker, 6, "python");
  await createTask(page, task, 5, "python, sql");
  await assignTask(page, task, worker, nextMonday());

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(assignmentRow(page, task)).toHaveCount(0);
});

test("ESC-36 auto-asignar desde la interfaz", async ({ page }) => {
  const task = `Auto ${uid()}`;
  await createTask(page, task, 2, "python");

  await page.getByRole("button", { name: "Auto-asignar" }).click();

  await expect(page.getByRole("list", { name: "Asignadas" })).toContainText(task);
  // "Migrar a Rust" (seed) no la puede tomar nadie
  await expect(page.getByRole("list", { name: "Sin asignar" })).toContainText("Migrar a Rust");
});
