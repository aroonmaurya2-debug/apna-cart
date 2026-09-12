import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Apna Cart is served from the root of the Render web service.
export default defineConfig({
  base: '/',
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
