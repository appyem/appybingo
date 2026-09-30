import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@repositories': path.resolve(__dirname, 'src/repositories'),
      '@bingo-types': path.resolve(__dirname, 'src/types'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
  test: { 
    environment: 'node', 
    include: ['src/**/*.test.ts'] 
  },
});
