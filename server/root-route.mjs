import path from 'node:path'
import express from 'express'
import { app } from './server.mjs'

// Prevent the browser from reusing an old HTML/JS bundle after frontend fixes.
app.use((_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.setHeader('Pragma', 'no-cache')
  response.setHeader('Expires', '0')
  next()
})

// Serve the production Vite build from the same Render web service.
const distDirectory = path.resolve(process.cwd(), 'dist')
app.use(express.static(distDirectory, { etag: false, maxAge: 0 }))

// Keep API endpoints working, while the site root opens the actual Apna Cart app.
app.get('/', (_request, response) => {
  response.sendFile(path.join(distDirectory, 'index.html'))
})

// Support client-side routes such as /products, /cart, etc. without replacing API responses.
app.get(/^(?!\/api(?:\/|$)).*/, (_request, response) => {
  response.sendFile(path.join(distDirectory, 'index.html'))
})

app.listen(Number(process.env.PORT || 8787), () => {
  console.log(`Apna Cart server listening on port ${process.env.PORT || 8787}`)
})
