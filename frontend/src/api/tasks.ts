import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from './client';
import type { components } from './schema';

export type Task = components['schemas']['TaskOut'];
export type TaskPage = components['schemas']['TaskPage'];

export const taskKeys = {
  all: ['tasks'] as const,
  list: (page: number, size: number) => [...taskKeys.all, 'list', page, size] as const,
};

export function useTasks(page: number, size: number) {
  return useQuery({
    queryKey: taskKeys.list(page, size),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/tasks', {
        params: { query: { page, size } },
      });
      if (error) throw new Error('No se pudieron cargar las tasks');
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
