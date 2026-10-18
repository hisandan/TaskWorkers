import { QueryClient } from '@tanstack/react-query';
import createFetchClient from 'openapi-fetch';
import createClient from 'openapi-react-query';

import type { components, paths } from '@src/api/api.generated';

export type Schemas = components['schemas'];

// baseUrl vacío: en dev, /api/* pasa por el proxy de Vite hacia FastAPI
export const fetchClient = createFetchClient<paths>({ baseUrl: '' });

// Cliente con hooks de openapi-react-query. Para la app preferir api/hooks.ts:
// mismas claves de caché, errores normalizados (ApiError) e invalidaciones correctas.
export const api = createClient(fetchClient);

// Singleton: todas las islas de Astro comparten la misma caché
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: 0 },
  },
});
