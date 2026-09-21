import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { cwd } from 'node:process'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')
  const lambdaUrl = env.VITE_AI_LAMBDA_URL?.trim()

  return {
    plugins: [react()],
    // Proxy Lambda calls in development so the browser makes a same-origin
    // request. Vite performs the cross-origin request server-side, where
    // browser CORS restrictions do not apply.
    server: lambdaUrl
      ? {
          proxy: {
            '/api/ai': {
              target: lambdaUrl,
              changeOrigin: true,
              rewrite: () => '/',
            },
          },
        }
      : undefined,
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
  }
})
