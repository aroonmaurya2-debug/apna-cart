import { app } from '../../server/server.mjs'

export const handler = async (event, context) => {
  const method = event.httpMethod || 'GET'
  const rawPath = event.path || '/.netlify/functions/api'
  const prefix = '/.netlify/functions/api'
  const apiPath = rawPath.startsWith(prefix) ? rawPath.slice(prefix.length) || '/' : rawPath
  const query = event.rawQuery ? `?${event.rawQuery}` : ''
  const url = `https://netlify.local${apiPath}${query}`
  const headers = new Headers(event.headers || {})
  const body = event.body && event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body

  const request = new Request(url, { method, headers, body: method === 'GET' || method === 'HEAD' ? undefined : body })
  const response = await app.fetch(request)
  const responseBody = await response.text()
  const responseHeaders = {}
  response.headers.forEach((value, key) => { responseHeaders[key] = value })

  return { statusCode: response.status, headers: responseHeaders, body: responseBody, isBase64Encoded: false }
}
