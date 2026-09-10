import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Apna Cart is deployed as a GitHub Pages project site at /apna-cart/.
export default defineConfig({
  base: '/apna-cart/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
