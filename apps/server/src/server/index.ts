import { serve } from '@hono/node-server'
import { app } from './app.ts'

const port = parseInt(process.env.PORT || '3001', 10)
const hostname = process.env.HOST || '127.0.0.1'

serve({ fetch: app.fetch, port, hostname }, (info) => {
  console.log(`Server running at http://${info.address}:${info.port}`)
})
