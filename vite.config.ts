import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Apna Cart is served from the root of the Render web service.
// Keep a single Vite HTML entry so production always gets the React bundle
// injected into index.html. Use hashed JS filenames so browsers cannot keep
// an older frontend bundle after a deployment.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
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
