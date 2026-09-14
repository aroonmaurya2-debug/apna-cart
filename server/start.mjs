import http from 'node:http'
import { spawn } from 'node:child_process'

const publicPort = Number(process.env.PORT || 3000)
const backendPort = publicPort + 1

const backend = spawn(process.execPath, ['server/server.mjs'], {
  env: { ...process.env, PORT: String(backendPort) },
  stdio: 'inherit',
})

backend.on('error', (error) => {
  console.error('Failed to start Apna Cart backend:', error)
  process.exit(1)
})

const rewritePath = (requestUrl = '/') => {
  const url = new URL(requestUrl, 'http://localhost')
  if (url.pathname === '/apna-cart' || url.pathname === '/apna-cart/') {
    url.pathname = '/'
  } else if (url.pathname.startsWith('/apna-cart/')) {
    url.pathname = url.pathname.slice('/apna-cart'.length)
  }
  return `${url.pathname}${url.search}`
}

const proxy = http.createServer((request, response) => {
  const proxyRequest = http.request({
    hostname: '127.0.0.1',
    port: backendPort,
    method: request.method,
    path: rewritePath(request.url),
    headers: { ...request.headers, host: `127.0.0.1:${backendPort}` },
  }, (proxyResponse) => {
    response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers)
    proxyResponse.pipe(response)
  })

  proxyRequest.on('error', (error) => {
    console.error('Apna Cart proxy error:', error.message)
    if (!response.headersSent) response.writeHead(502, { 'Content-Type': 'text/plain' })
    response.end('Apna Cart server is starting. Please refresh in a few seconds.')
  })

  request.pipe(proxyRequest)
})

proxy.listen(publicPort, '0.0.0.0', () => {
  console.log(`Apna Cart web server listening on ${publicPort}`)
  console.log(`Backend running internally on ${backendPort}`)
})

const shutdown = (signal) => {
  console.log(`Received ${signal}; shutting down Apna Cart.`)
  proxy.close(() => backend.kill('SIGTERM'))
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
