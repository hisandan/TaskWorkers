// @ts-check
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    // En dev, /api/* se redirige a FastAPI: sin CORS ni URLs fijas
    server: { proxy: { '/api': 'http://localhost:8000' } },
  },
});
