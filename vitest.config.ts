import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8'
    },
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts']
  }
})
