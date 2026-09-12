import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Apna Cart is deployed as a GitHub Pages project site at /apna-cart/.
export default defineConfig({
  base: '/apna-cart/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        app: 'src/entry.tsx',
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/chunk-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
