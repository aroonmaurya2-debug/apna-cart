const RENDER_API_BASE = 'https://apna-cart-2rcq.onrender.com'

const getApiBase = () => String(process.env.API_BASE_URL || RENDER_API_BASE).replace(/\/$/, '')

export const handler = async (event) => {
  const base = getApiBase()
  const prefix = '/.netlify/functions/api'
  const incomingPath = event.path?.startsWith(prefix) ? event.path.slice(prefix.length) || '/' : '/'
  const target = `${base}${incomingPath}${event.rawQuery ? `?${event.rawQuery}` : ''}`
  const headers = { ...event.headers }
  delete headers.host
  delete headers.connection

  const body = event.body && event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body
  const response = await fetch(target, {
    method: event.httpMethod || 'GET',
    headers,
    body: ['GET', 'HEAD'].includes(event.httpMethod || 'GET') ? undefined : body,
  })

  const responseBody = await response.text()
  const responseHeaders = {}
  response.headers.forEach((value, key) => { responseHeaders[key] = value })
  return { statusCode: response.status, headers: responseHeaders, body: responseBody }
}
