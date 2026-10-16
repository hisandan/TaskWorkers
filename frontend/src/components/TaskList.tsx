import { QueryClientProvider, keepPreviousData } from '@tanstack/react-query';
import { useState } from 'react';

import { api, queryClient } from '@src/api/client';

const SIZE = 10;

function Tasks() {
  const [page, setPage] = useState(1);
  const { data, isPending, error } = api.useQuery(
    'get',
    '/api/v1/tasks',
    { params: { query: { page, size: SIZE } } },
    { placeholderData: keepPreviousData },
  );

  if (isPending) return <p>Cargando...</p>;
  if (error) return <p>No se pudieron cargar las tasks</p>;

  const totalPages = Math.max(1, Math.ceil(data.total / SIZE));

  return (
    <div>
      <ul>
        {data.items.map((task) => (
          <li key={task.id}>{task.name}</li>
        ))}
      </ul>
      <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
        Anterior
      </button>
      <span>
        {' '}
        Página {page} de {totalPages}{' '}
      </span>
      <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
        Siguiente
      </button>
    </div>
  );
}

export default function TaskList() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tasks />
    </QueryClientProvider>
  );
}
