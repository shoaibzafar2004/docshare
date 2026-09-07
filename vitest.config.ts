import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      DATABASE_PATH: ':memory:',
    },
    server: {
      deps: {
        external: [/^node:sqlite$/],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
