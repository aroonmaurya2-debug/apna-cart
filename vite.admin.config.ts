import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Standalone build for the Owner/Admin app.
// Everything is emitted inside dist/admin so the separate Render static site
// can publish it directly without affecting the customer frontend build.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist/admin',
    emptyOutDir: true,
    rollupOptions: {
      input: 'admin/index.html',
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/chunk-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
