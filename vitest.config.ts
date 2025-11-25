import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/control-plane/test/**/*.test.ts'],
    pool: 'threads',
    minWorkers: 1,
    maxWorkers: 1,
    sequence: {
      concurrent: false,
    },
  },
})
