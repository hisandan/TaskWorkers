import { QueryClientProvider } from '@tanstack/react-query';

import { api, queryClient } from '@src/api/client';

function Tasks() {
  const { data, isPending, error } = api.useQuery('get', '/api/v1/tasks');

  if (isPending) return <p>Cargando...</p>;
  if (error) return <p>No se pudieron cargar las tareas</p>;

  return (
    <ul>
      {data.map((task) => (
        <li key={task.id}>
          {task.name} · {task.effort} h · {task.status}
        </li>
      ))}
    </ul>
  );
}

export default function TaskList() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tasks />
    </QueryClientProvider>
  );
}
