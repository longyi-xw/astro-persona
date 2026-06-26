import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const root = fileURLToPath(new URL('./', import.meta.url))
const src = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~~': root,
      '@@': root,
      '~': src,
      '@': src,
    },
  },
  test: {
    globals: true,
    // core tests are pure (node). Component tests opt into happy-dom via
    // a `// @vitest-environment happy-dom` header comment.
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts'],
  },
})
