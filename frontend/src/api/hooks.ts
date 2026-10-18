// Hooks de datos del planificador: queries y mutations tipadas sobre el cliente generado.
//
// - Todas las funciones lanzan ApiError (api/errors.ts); para mostrarlo usar errorMessage(error, ctx).
// - Claves de caché propias (queryKeys) para invalidar sin depender del formato de openapi-react-query.
// - Asignar, mover o desasignar cambia las fechas de OTRAS asignaciones del mismo trabajador (RN26):
//   por eso esas mutations invalidan la lista completa de asignaciones, haya éxito o error.
// - Asignar / mover / desasignar son optimistas: la caché cambia al instante (el calendario se
//   redibuja con shared/lib/agenda.ts) y vuelve atrás si la API rechaza.

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { fetchClient, type Schemas } from '@src/api/client';
import { ApiError } from '@src/api/errors';

export type Task = Schemas['TaskOut'];
export type TaskInput = Schemas['TaskIn'];
export type TaskUpdate = Schemas['TaskUpdate'];
export type TaskStatus = Task['status'];
export type Worker = Schemas['WorkerOut'];
export type WorkerInput = Schemas['WorkerIn'];
export type Assignment = Schemas['AssignmentOut'];
export type AssignmentInput = Schemas['AssignmentIn'];
export type AssignmentMove = Schemas['AssignmentMove'];
export type AutoAssignResult = Schemas['AutoAssignOut'];

export const queryKeys = {
  tasks: ['tasks'] as const,
  workers: ['workers'] as const,
  assignments: ['assignments'] as const,
};

type FetchResult<T> = { data?: T; error?: unknown; response: Response };

/** Espera la llamada de openapi-fetch y devuelve `data`, o lanza ApiError */
async function call<T>(request: Promise<FetchResult<T>>): Promise<T> {
  let result: FetchResult<T>;
  try {
    result = await request;
  } catch (cause) {
    throw ApiError.network(cause);
  }
  if (!result.response.ok || result.error !== undefined) {
    // El proxy de Vite responde 500/502/504 sin JSON cuando el backend no está: es "red"
    if (result.response.status >= 502 && result.error === undefined)
      throw ApiError.network(result.response.statusText);
    throw ApiError.fromResponse(result.response.status, result.error);
  }
  return result.data as T;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useTasks() {
  return useQuery<Task[], ApiError>({
    queryKey: queryKeys.tasks,
    queryFn: ({ signal }) => call(fetchClient.GET('/api/v1/tasks', { signal })),
  });
}

export function useWorkers() {
  return useQuery<Worker[], ApiError>({
    queryKey: queryKeys.workers,
    queryFn: ({ signal }) => call(fetchClient.GET('/api/v1/workers', { signal })),
  });
}

export function useAssignments() {
  return useQuery<Assignment[], ApiError>({
    queryKey: queryKeys.assignments,
    queryFn: ({ signal }) => call(fetchClient.GET('/api/v1/assignments', { signal })),
  });
}

// ---------------------------------------------------------------------------
// Helpers de invalidación y caché optimista
// ---------------------------------------------------------------------------

function invalidate(client: QueryClient, ...keys: (readonly string[])[]) {
  return Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
}

/** Ids negativos = asignaciones optimistas que la API todavía no confirmó (no arrastrables) */
export function isPendingId(id: number): boolean {
  return id < 0;
}

let optimisticId = 0;

type AssignmentsSnapshot = { previous: Assignment[] | undefined };

async function patchAssignments(
  client: QueryClient,
  update: (list: Assignment[]) => Assignment[],
): Promise<AssignmentsSnapshot> {
  await client.cancelQueries({ queryKey: queryKeys.assignments });
  const previous = client.getQueryData<Assignment[]>(queryKeys.assignments);
  if (previous) client.setQueryData<Assignment[]>(queryKeys.assignments, update(previous));
  return { previous };
}

function rollback(client: QueryClient, snapshot: AssignmentsSnapshot | undefined) {
  if (snapshot?.previous) client.setQueryData(queryKeys.assignments, snapshot.previous);
}

// ---------------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------------

/** POST /tasks (la API no acepta `status`: una tarea nueva siempre es not-done) */
export function useCreateTask() {
  const client = useQueryClient();
  return useMutation<Task, ApiError, TaskInput>({
    mutationFn: (body) => call(fetchClient.POST('/api/v1/tasks', { body })),
    onSettled: () => invalidate(client, queryKeys.tasks),
  });
}

/** PUT /tasks/{id}: cambiar el esfuerzo mueve las fechas de la agenda del trabajador */
export function useUpdateTask() {
  const client = useQueryClient();
  return useMutation<Task, ApiError, { id: number; body: TaskUpdate }>({
    mutationFn: ({ id, body }) =>
      call(fetchClient.PUT('/api/v1/tasks/{task_id}', { params: { path: { task_id: id } }, body })),
    onSettled: () => invalidate(client, queryKeys.tasks, queryKeys.assignments),
  });
}

/** DELETE /tasks/{id} (HasAssignments si está asignada) */
export function useDeleteTask() {
  const client = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await call(fetchClient.DELETE('/api/v1/tasks/{task_id}', { params: { path: { task_id: id } } }));
    },
    onSettled: () => invalidate(client, queryKeys.tasks, queryKeys.assignments),
  });
}

// ---------------------------------------------------------------------------
// Trabajadores
// ---------------------------------------------------------------------------

export function useCreateWorker() {
  const client = useQueryClient();
  return useMutation<Worker, ApiError, WorkerInput>({
    mutationFn: (body) => call(fetchClient.POST('/api/v1/workers', { body })),
    onSettled: () => invalidate(client, queryKeys.workers),
  });
}

/** PUT /workers/{id}: cambiar la disponibilidad mueve las fechas de su agenda */
export function useUpdateWorker() {
  const client = useQueryClient();
  return useMutation<Worker, ApiError, { id: number; body: WorkerInput }>({
    mutationFn: ({ id, body }) =>
      call(fetchClient.PUT('/api/v1/workers/{worker_id}', { params: { path: { worker_id: id } }, body })),
    onSettled: () => invalidate(client, queryKeys.workers, queryKeys.assignments),
  });
}

/** DELETE /workers/{id} (HasAssignments si tiene asignaciones) */
export function useDeleteWorker() {
  const client = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await call(fetchClient.DELETE('/api/v1/workers/{worker_id}', { params: { path: { worker_id: id } } }));
    },
    onSettled: () => invalidate(client, queryKeys.workers, queryKeys.assignments),
  });
}

// ---------------------------------------------------------------------------
// Asignaciones
// ---------------------------------------------------------------------------

/** POST /assignments { task_id, worker_id, start_date } (optimista) */
export function useAssignTask() {
  const client = useQueryClient();
  return useMutation<Assignment, ApiError, AssignmentInput, AssignmentsSnapshot>({
    mutationFn: (body) => call(fetchClient.POST('/api/v1/assignments', { body })),
    onMutate: (body) =>
      patchAssignments(client, (list) => [
        ...list,
        // end_date provisional: el dibujo usa agenda.ts, que no lo necesita
        { id: --optimisticId, ...body, end_date: body.start_date },
      ]),
    onError: (_error, _body, snapshot) => rollback(client, snapshot),
    onSettled: () => invalidate(client, queryKeys.assignments, queryKeys.tasks),
  });
}

/** PUT /assignments/{id} { worker_id, start_date } (optimista) */
export function useMoveAssignment() {
  const client = useQueryClient();
  return useMutation<Assignment, ApiError, { id: number } & AssignmentMove, AssignmentsSnapshot>({
    mutationFn: ({ id, worker_id, start_date }) =>
      call(
        fetchClient.PUT('/api/v1/assignments/{assignment_id}', {
          params: { path: { assignment_id: id } },
          body: { worker_id, start_date },
        }),
      ),
    onMutate: ({ id, worker_id, start_date }) =>
      patchAssignments(client, (list) =>
        list.map((a) => (a.id === id ? { ...a, worker_id, start_date, end_date: start_date } : a)),
      ),
    onError: (_error, _vars, snapshot) => rollback(client, snapshot),
    onSettled: () => invalidate(client, queryKeys.assignments, queryKeys.tasks),
  });
}

/** DELETE /assignments/{id} (optimista) */
export function useUnassign() {
  const client = useQueryClient();
  return useMutation<void, ApiError, number, AssignmentsSnapshot>({
    mutationFn: async (id) => {
      await call(
        fetchClient.DELETE('/api/v1/assignments/{assignment_id}', {
          params: { path: { assignment_id: id } },
        }),
      );
    },
    onMutate: (id) => patchAssignments(client, (list) => list.filter((a) => a.id !== id)),
    onError: (_error, _id, snapshot) => rollback(client, snapshot),
    onSettled: () => invalidate(client, queryKeys.assignments, queryKeys.tasks),
  });
}

/** POST /assignments/auto -> { assigned, unassigned } */
export function useAutoAssign() {
  const client = useQueryClient();
  return useMutation<AutoAssignResult, ApiError, void>({
    mutationFn: () => call(fetchClient.POST('/api/v1/assignments/auto')),
    onSettled: () => invalidate(client, queryKeys.assignments, queryKeys.tasks),
  });
}
