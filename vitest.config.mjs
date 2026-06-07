import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.mjs'],
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist', 'old_assets'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
