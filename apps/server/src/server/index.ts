import { serve } from '@hono/node-server'
import { app } from './app.ts'

const port = parseInt(process.env.PORT || '3001', 10)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`)
})
