const getApiBase = () => String(process.env.API_BASE_URL || '').replace(/\/$/, '')

export const handler = async (event) => {
  const base = getApiBase()
  if (!base) {
    return {
      statusCode: 503,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Apna Cart API is not connected yet. Set API_BASE_URL to the deployed Express API.' }),
    }
  }

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
