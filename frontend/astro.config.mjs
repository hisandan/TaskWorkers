// @ts-check
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    // En dev, /api/* se redirige a FastAPI: sin CORS ni URLs fijas
    server: { proxy: { '/api': 'http://localhost:8000' } },
    // Pre-empaqueta las dependencias de la isla al arrancar: evita el "504 Outdated Optimize Dep"
    // cuando Vite las descubre tarde (p.ej. después de instalar paquetes con el server encendido)
    optimizeDeps: {
      include: [
        '@dnd-kit/core',
        '@dnd-kit/utilities',
        '@tanstack/react-query',
        'date-fns',
        'date-fns/locale',
        'lucide-react',
        'openapi-fetch',
        'openapi-react-query',
      ],
    },
  },
});
