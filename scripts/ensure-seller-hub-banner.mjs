import fs from 'node:fs'
import path from 'node:path'

const file = path.resolve('index.html')
if (fs.existsSync(file)) {
  let html = fs.readFileSync(file, 'utf8')
  const tag = '<script src="/seller-hub-banner.js" defer></script>'
  if (!html.includes(tag)) {
    html = html.replace('    <script src="/account-page.js" defer></script>', `    ${tag}\n    <script src="/account-page.js" defer></script>`)
    fs.writeFileSync(file, html)
  }
}

// Render runs the Express server in front of the Vite build. Make sure
// browser routes such as /seller serve the SPA entry instead of returning
// Express's "Cannot GET /seller" response.
const serverFile = path.resolve('server/server.mjs')
if (fs.existsSync(serverFile)) {
  let server = fs.readFileSync(serverFile, 'utf8')
  const staticLine = "app.use(express.static(path.join(__dirname, '..', 'dist')))"
  const fallback = `${staticLine}\napp.use((request, response, next) => {\n  if (request.method === 'GET' && !request.path.startsWith('/api/') && request.accepts('html')) {\n    return response.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))\n  }\n  return next()\n})`
  if (server.includes(staticLine) && !server.includes("request.path.startsWith('/api/')")) {
    server = server.replace(staticLine, fallback)
    fs.writeFileSync(serverFile, server)
  }
}
