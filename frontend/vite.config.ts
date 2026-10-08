/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Same .env files the app reads (see .env for what each value means).
  const env = loadEnv(mode, '.', 'VITE_');
  const apiBase = env.VITE_API_BASE_URL ?? '';

  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_DEV_PORT) || undefined,
      // A relative API base (e.g. /api/v1) is proxied to the backend. Only used when mocks are off,
      // since MSW answers in the browser before the request reaches the dev server.
      proxy: apiBase.startsWith('/')
        ? { [`/${apiBase.split('/')[1]}`]: { target: env.VITE_BACKEND_URL, changeOrigin: true } }
        : undefined,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
