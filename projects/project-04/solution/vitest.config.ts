import { defineConfig } from 'vitest/config';
import path from 'path';

// Separate from vite.config.ts (whose root is src/renderer for the build).
// Vitest needs the project root so it can discover service-level tests under
// src/services/__tests__ and resolve the @shared / @services aliases.
export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@services': path.resolve(__dirname, 'src/services'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
