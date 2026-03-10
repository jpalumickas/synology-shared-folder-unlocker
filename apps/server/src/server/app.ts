import { Hono } from 'hono'
import type { Context } from 'hono'
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
  fetchHostKey,
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

function setSessionCookie(c: Context, token: string) {
  const isSecure = new URL(c.req.url).protocol === 'https:'
  setCookie(c, 'session', token, {
    httpOnly: true,
    sameSite: 'Strict',
    secure: isSecure,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

function stripShareFolderPassword(
  sf: EncryptedShareFolder
): Omit<EncryptedShareFolder, 'password'> {
  const { password, ...rest } = sf
  void password
  return rest
}

function stripPassword(nas: NasDevice): Omit<
  NasDevice,
  'password' | 'shareFolders'
> & {
  shareFolders: Omit<EncryptedShareFolder, 'password'>[]
} {
  const { password, ...rest } = nas
  void password
  return {
    ...rest,
    shareFolders: rest.shareFolders.map(stripShareFolderPassword),
  }
}

// Rate limiting for auth endpoints to prevent brute-force and CPU exhaustion
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 5
const failedAuthAttempts: number[] = []

function pruneOldAttempts() {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW
  while (failedAuthAttempts.length > 0 && failedAuthAttempts[0] < cutoff) {
    failedAuthAttempts.shift()
  }
}

export function resetRateLimit() {
  failedAuthAttempts.length = 0
}

const rateLimitAuth = createMiddleware(async (c, next) => {
  pruneOldAttempts()

  if (failedAuthAttempts.length >= RATE_LIMIT_MAX) {
    return c.json({ error: 'Too many attempts, try again later' }, 429)
  }

  await next()

  if (c.res.status === 401) {
    failedAuthAttempts.push(Date.now())
  }
})

const app = new Hono()
const api = new Hono()

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

  const body = await c.req.json<{ password?: unknown }>()
  if (typeof body.password !== 'string' || body.password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400)
  }

  const { password } = body

  const config: AppConfig = { pollingInterval: 120, nasList: [] }
  await saveConfig(config, password)
  const sessionToken = store.unlock(config, password)
  setSessionCookie(c, sessionToken)

  return c.json({ success: true })
})

api.post('/unlock', rateLimitAuth, async (c) => {
  if (!(await configExists())) {
    return c.json({ error: 'Not initialized' }, 400)
  }

  const body = await c.req.json<{ password?: unknown }>()
  if (typeof body.password !== 'string' || body.password.length === 0) {
    return c.json({ error: 'Password is required' }, 400)
  }

  const { password } = body

  try {
    const config = (await loadConfig(password)) as AppConfig
    const sessionToken = store.unlock(config, password)
    setSessionCookie(c, sessionToken)

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

api.get('/share-folders/status', requireSession, (c) => {
  return c.json(store.getShareFolderStatuses())
})

api.post('/share-folders/poll', requireSession, async (c) => {
  await pollOnce()
  return c.json({ success: true, statuses: store.getShareFolderStatuses() })
})

// --- Routes requiring valid session ---

api.get('/nas', requireSession, (c) => {
  const config = store.requireConfig()
  return c.json(config.nasList.map(stripPassword))
})

api.post('/nas', requireSession, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()

  if (typeof body.name !== 'string' || body.name.length === 0) {
    return c.json({ error: 'Name is required' }, 400)
  }

  if (typeof body.host !== 'string' || body.host.length === 0) {
    return c.json({ error: 'Host is required' }, 400)
  }

  if (typeof body.username !== 'string' || body.username.length === 0) {
    return c.json({ error: 'Username is required' }, 400)
  }

  if (typeof body.password !== 'string' || body.password.length === 0) {
    return c.json({ error: 'Password is required' }, 400)
  }

  if (
    body.port !== undefined &&
    (typeof body.port !== 'number' || body.port < 1 || body.port > 65535)
  ) {
    return c.json({ error: 'Port must be a number between 1 and 65535' }, 400)
  }

  const config = store.requireConfig()
  const password = store.requireMasterPassword()

  const port = (body.port as number) || 22

  let hostKey: { type: string; fingerprint: string }
  try {
    hostKey = await fetchHostKey(body.host as string, port)
  } catch {
    return c.json({ error: 'Could not verify host key' }, 400)
  }

  const nas: NasDevice = {
    id: randomUUID(),
    name: body.name as string,
    host: body.host as string,
    port,
    username: body.username as string,
    password: body.password as string,
    hostKeyType: hostKey.type,
    hostFingerprint: hostKey.fingerprint,
    shareFolders: [],
  }

  config.nasList.push(nas)
  store.updateConfig(config)
  await saveConfig(config, password)

  return c.json(stripPassword(nas), 201)
})

api.put('/nas/:id', requireSession, async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json<Record<string, unknown>>()

  if (
    body.name !== undefined &&
    (typeof body.name !== 'string' || body.name.length === 0)
  ) {
    return c.json({ error: 'Name must be a non-empty string' }, 400)
  }

  if (
    body.host !== undefined &&
    (typeof body.host !== 'string' || body.host.length === 0)
  ) {
    return c.json({ error: 'Host must be a non-empty string' }, 400)
  }

  if (
    body.port !== undefined &&
    (typeof body.port !== 'number' || body.port < 1 || body.port > 65535)
  ) {
    return c.json({ error: 'Port must be a number between 1 and 65535' }, 400)
  }

  const config = store.requireConfig()
  const password = store.requireMasterPassword()

  const nas = config.nasList.find((n) => n.id === id)
  if (!nas) {
    return c.json({ error: 'NAS not found' }, 404)
  }

  if (typeof body.name === 'string') {
    nas.name = body.name
  }

  if (typeof body.host === 'string') {
    nas.host = body.host
  }

  if (typeof body.port === 'number') {
    nas.port = body.port
  }

  const hostChanged = body.host !== undefined || body.port !== undefined

  if (hostChanged) {
    try {
      const hostKey = await fetchHostKey(nas.host, nas.port)
      nas.hostKeyType = hostKey.type
      nas.hostFingerprint = hostKey.fingerprint
    } catch {
      return c.json({ error: 'Could not verify host key' }, 400)
    }
  }

  store.updateConfig(config)
  await saveConfig(config, password)

  return c.json(stripPassword(nas))
})

api.put('/nas/:id/credentials', requireSession, async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json<Record<string, unknown>>()

  if (typeof body.username !== 'string' || body.username.length === 0) {
    return c.json({ error: 'Username is required' }, 400)
  }

  if (typeof body.password !== 'string' || body.password.length === 0) {
    return c.json({ error: 'Password is required' }, 400)
  }

  const config = store.requireConfig()
  const masterPassword = store.requireMasterPassword()

  const nas = config.nasList.find((n) => n.id === id)
  if (!nas) {
    return c.json({ error: 'NAS not found' }, 404)
  }

  nas.username = body.username
  nas.password = body.password

  store.updateConfig(config)
  await saveConfig(config, masterPassword)

  return c.json(stripPassword(nas))
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
  const body = await c.req.json<Record<string, unknown>>()

  if (typeof body.name !== 'string' || body.name.length === 0) {
    return c.json({ error: 'Name is required' }, 400)
  }

  if (typeof body.password !== 'string' || body.password.length === 0) {
    return c.json({ error: 'Password is required' }, 400)
  }

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

  return c.json(stripShareFolderPassword(shareFolder), 201)
})

api.put(
  '/nas/:nasId/share-folders/:shareFolderId',
  requireSession,
  async (c) => {
    const { nasId, shareFolderId } = c.req.param()
    const body = await c.req.json<Record<string, unknown>>()

    if (typeof body.password !== 'string' || body.password.length === 0) {
      return c.json({ error: 'Password is required' }, 400)
    }

    const config = store.requireConfig()
    const masterPassword = store.requireMasterPassword()

    const nas = config.nasList.find((n) => n.id === nasId)
    if (!nas) {
      return c.json({ error: 'NAS not found' }, 404)
    }

    const shareFolder = nas.shareFolders.find((s) => s.id === shareFolderId)
    if (!shareFolder) {
      return c.json({ error: 'Share folder not found' }, 404)
    }

    shareFolder.password = body.password

    store.updateConfig(config)
    await saveConfig(config, masterPassword)

    return c.json(stripShareFolderPassword(shareFolder))
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
  const body = await c.req.json<Record<string, unknown>>()

  if (
    body.pollingInterval !== undefined &&
    (typeof body.pollingInterval !== 'number' || body.pollingInterval < 1)
  ) {
    return c.json({ error: 'Polling interval must be a positive number' }, 400)
  }

  const config = store.requireConfig()
  const password = store.requireMasterPassword()

  if (typeof body.pollingInterval === 'number') {
    config.pollingInterval = Math.max(10, body.pollingInterval)
  }

  store.updateConfig(config)
  await saveConfig(config, password)
  restartPoller()

  return c.json({ pollingInterval: config.pollingInterval })
})

api.post('/change-password', requireSession, rateLimitAuth, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()

  if (
    typeof body.currentPassword !== 'string' ||
    body.currentPassword.length === 0
  ) {
    return c.json({ error: 'Current password is required' }, 400)
  }

  if (typeof body.newPassword !== 'string' || body.newPassword.length < 8) {
    return c.json({ error: 'New password must be at least 8 characters' }, 400)
  }

  const { currentPassword, newPassword } = body

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
