import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: true,
    // Mock auth is explicitly enabled for the test environment only.
    env: {
      MODE: 'test',
      VITE_ALLOW_MOCK_AUTH: 'true',
    },
  },
})
