import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Base path para GitHub Pages: el repo se sirve bajo /<repo-name>/
  base: '/picoTester/',
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
})
