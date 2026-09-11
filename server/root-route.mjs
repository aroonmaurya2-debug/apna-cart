import { app } from './server.mjs'

app.get('/', (_request, response) => {
  response.json({ ok: true, service: 'apna-cart-api', message: 'Apna Cart backend is running.' })
})
