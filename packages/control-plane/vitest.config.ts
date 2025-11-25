import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
    pool: 'threads',
    minWorkers: 1,
    maxWorkers: 1,
    sequence: {
      concurrent: false,
    },
  },
})
