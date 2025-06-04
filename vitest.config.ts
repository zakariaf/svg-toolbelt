import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'demo/**',
        'docs/**',
        'coverage/**',
        'test/**',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      all: true,
    },
  },
});
