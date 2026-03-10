import { serve } from '@hono/node-server'
import { stopPoller } from '@synology-shared-folder-unlocker/unlocker'
import { app } from './app.ts'

const port = parseInt(process.env.PORT || '3001', 10)
const hostname = process.env.HOST || '127.0.0.1'

const server = serve({ fetch: app.fetch, port, hostname }, (info) => {
  console.log(`Server running at http://${info.address}:${info.port}`)
})

function shutdown() {
  console.log('Shutting down...')
  stopPoller()
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
