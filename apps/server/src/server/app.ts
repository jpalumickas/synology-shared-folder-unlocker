import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import {
  store,
  startPoller,
  restartPoller,
  pollOnce,
  unlockShareFolder,
  fetchHostFingerprint,
} from '@synology-shared-folder-unlocker/unlocker'
import {
  saveConfig,
  loadConfig,
  configExists,
  verifyConfigPassword,
  type AppConfig,
  type NasDevice,
  type EncryptedShareFolder,
} from '@synology-shared-folder-unlocker/config'

const app = new Hono()
const api = new Hono()

const requireUnlocked = createMiddleware(async (c, next) => {
  if (!store.isUnlocked) {
    return c.json({ error: 'App is locked' }, 403)
  }

  await next()
})

const requireSession = createMiddleware(async (c, next) => {
  if (!store.isUnlocked) {
    return c.json({ error: 'App is locked' }, 403)
  }

  const token = getCookie(c, 'session')

  if (!store.isSessionValid(token)) {
    return c.json({ error: 'Session expired' }, 401)
  }

  await next()
})

// --- Public routes ---

api.get('/status', async (c) => {
  const initialized = await configExists()
  const unlocked = store.isUnlocked
  const token = getCookie(c, 'session')
  const sessionValid = store.isSessionValid(token)
  return c.json({ initialized, unlocked, sessionValid })
})

api.post('/init', async (c) => {
  if (await configExists()) {
    return c.json({ error: 'Already initialized' }, 400)
  }

  const { password } = await c.req.json<{ password: string }>()
  if (!password || password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400)
  }

  const config: AppConfig = { pollingInterval: 120, nasList: [] }
  await saveConfig(config, password)
  const sessionToken = store.unlock(config, password)

  setCookie(c, 'session', sessionToken, {
    httpOnly: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return c.json({ success: true })
})

api.post('/unlock', async (c) => {
  if (!(await configExists())) {
    return c.json({ error: 'Not initialized' }, 400)
  }

  const { password } = await c.req.json<{ password: string }>()

  try {
    const config = (await loadConfig(password)) as AppConfig
    const sessionToken = store.unlock(config, password)

    setCookie(c, 'session', sessionToken, {
      httpOnly: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    startPoller()
    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Invalid password' }, 401)
  }
})

api.post('/logout', (c) => {
  store.lockUI()
  deleteCookie(c, 'session', { path: '/' })
  return c.json({ success: true })
})

// --- Routes requiring app unlocked (no session needed) ---

api.get('/share-folders/status', requireUnlocked, (c) => {
  return c.json(store.getShareFolderStatuses())
})

api.post('/share-folders/poll', requireUnlocked, async (c) => {
  await pollOnce()
  return c.json({ success: true, statuses: store.getShareFolderStatuses() })
})

// --- Routes requiring valid session ---

api.get('/nas', requireSession, (c) => {
  const config = store.requireConfig()
  return c.json(config.nasList)
})

api.post('/nas', requireSession, async (c) => {
  const body = await c.req.json<Omit<NasDevice, 'id' | 'shareFolders'>>()
  const config = store.requireConfig()
  const password = store.requireMasterPassword()

  const port = body.port || 22

  let hostFingerprint: string
  try {
    hostFingerprint = await fetchHostFingerprint(body.host, port)
  } catch {
    return c.json({ error: 'Could not verify host fingerprint' }, 400)
  }

  const nas: NasDevice = {
    id: randomUUID(),
    name: body.name,
    host: body.host,
    port,
    username: body.username,
    password: body.password,
    hostFingerprint,
    shareFolders: [],
  }

  config.nasList.push(nas)
  store.updateConfig(config)
  await saveConfig(config, password)

  return c.json(nas, 201)
})

api.put('/nas/:id', requireSession, async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json<Partial<NasDevice>>()
  const config = store.requireConfig()
  const password = store.requireMasterPassword()

  const nas = config.nasList.find((n) => n.id === id)
  if (!nas) {
    return c.json({ error: 'NAS not found' }, 404)
  }

  if (body.name !== undefined) {
    nas.name = body.name
  }

  if (body.host !== undefined) {
    nas.host = body.host
  }

  if (body.port !== undefined) {
    nas.port = body.port
  }

  if (body.username !== undefined) {
    nas.username = body.username
  }

  if (body.password !== undefined) {
    nas.password = body.password
  }

  const hostChanged = body.host !== undefined || body.port !== undefined

  if (hostChanged) {
    try {
      nas.hostFingerprint = await fetchHostFingerprint(nas.host, nas.port)
    } catch {
      return c.json({ error: 'Could not verify host fingerprint' }, 400)
    }
  }

  store.updateConfig(config)
  await saveConfig(config, password)

  return c.json(nas)
})

api.delete('/nas/:id', requireSession, async (c) => {
  const { id } = c.req.param()
  const config = store.requireConfig()
  const password = store.requireMasterPassword()

  config.nasList = config.nasList.filter((n) => n.id !== id)
  store.removeNasStatuses(id)
  store.updateConfig(config)
  await saveConfig(config, password)
  restartPoller()

  return c.json({ success: true })
})

api.post('/nas/:nasId/share-folders', requireSession, async (c) => {
  const { nasId } = c.req.param()
  const body = await c.req.json<Omit<EncryptedShareFolder, 'id'>>()
  const config = store.requireConfig()
  const password = store.requireMasterPassword()

  const nas = config.nasList.find((n) => n.id === nasId)
  if (!nas) {
    return c.json({ error: 'NAS not found' }, 404)
  }

  const shareFolder: EncryptedShareFolder = {
    id: randomUUID(),
    name: body.name,
    password: body.password,
  }

  nas.shareFolders.push(shareFolder)
  store.setShareFolderStatus(nasId, shareFolder, 'unknown')
  store.updateConfig(config)
  await saveConfig(config, password)
  restartPoller()

  return c.json(shareFolder, 201)
})

api.put(
  '/nas/:nasId/share-folders/:shareFolderId',
  requireSession,
  async (c) => {
    const { nasId, shareFolderId } = c.req.param()
    const body = await c.req.json<Partial<EncryptedShareFolder>>()
    const config = store.requireConfig()
    const password = store.requireMasterPassword()

    const nas = config.nasList.find((n) => n.id === nasId)
    if (!nas) {
      return c.json({ error: 'NAS not found' }, 404)
    }

    const shareFolder = nas.shareFolders.find((s) => s.id === shareFolderId)
    if (!shareFolder) {
      return c.json({ error: 'Share folder not found' }, 404)
    }

    if (body.name !== undefined) {
      shareFolder.name = body.name
    }

    if (body.password !== undefined) {
      shareFolder.password = body.password
    }

    store.updateConfig(config)
    await saveConfig(config, password)

    return c.json(shareFolder)
  }
)

api.delete(
  '/nas/:nasId/share-folders/:shareFolderId',
  requireSession,
  async (c) => {
    const { nasId, shareFolderId } = c.req.param()
    const config = store.requireConfig()
    const password = store.requireMasterPassword()

    const nas = config.nasList.find((n) => n.id === nasId)
    if (!nas) {
      return c.json({ error: 'NAS not found' }, 404)
    }

    nas.shareFolders = nas.shareFolders.filter((s) => s.id !== shareFolderId)
    store.removeShareFolderStatus(nasId, shareFolderId)
    store.updateConfig(config)
    await saveConfig(config, password)

    return c.json({ success: true })
  }
)

api.post(
  '/nas/:nasId/share-folders/:shareFolderId/unlock',
  requireSession,
  async (c) => {
    const { nasId, shareFolderId } = c.req.param()
    const config = store.requireConfig()

    const nas = config.nasList.find((n) => n.id === nasId)
    if (!nas) {
      return c.json({ error: 'NAS not found' }, 404)
    }

    const shareFolder = nas.shareFolders.find((s) => s.id === shareFolderId)
    if (!shareFolder) {
      return c.json({ error: 'Share folder not found' }, 404)
    }

    const result = await unlockShareFolder(nas, shareFolder)
    store.updateShareFolderStatus(
      nasId,
      shareFolderId,
      result.success ? 'unlocked' : 'error',
      result.success ? undefined : result.message
    )

    return c.json(result)
  }
)

api.get('/settings', requireSession, (c) => {
  const config = store.requireConfig()
  return c.json({ pollingInterval: config.pollingInterval })
})

api.put('/settings', requireSession, async (c) => {
  const body = await c.req.json<{ pollingInterval?: number }>()
  const config = store.requireConfig()
  const password = store.requireMasterPassword()

  if (body.pollingInterval !== undefined) {
    config.pollingInterval = Math.max(10, body.pollingInterval)
  }

  store.updateConfig(config)
  await saveConfig(config, password)
  restartPoller()

  return c.json({ pollingInterval: config.pollingInterval })
})

api.post('/change-password', requireSession, async (c) => {
  const { currentPassword, newPassword } = await c.req.json<{
    currentPassword: string
    newPassword: string
  }>()

  if (!newPassword || newPassword.length < 8) {
    return c.json({ error: 'New password must be at least 8 characters' }, 400)
  }

  const valid = await verifyConfigPassword(currentPassword)
  if (!valid) {
    return c.json({ error: 'Current password is incorrect' }, 401)
  }

  const config = store.requireConfig()
  await saveConfig(config, newPassword)
  store.setMasterPassword(newPassword)

  return c.json({ success: true })
})

// Mount API
app.route('/api', api)

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use('*', serveStatic({ root: './dist/client' }))
  app.get('*', async (c) => {
    const html = await readFile('./dist/client/index.html', 'utf8')
    return c.html(html)
  })
}

export { app }
