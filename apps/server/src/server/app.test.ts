import { describe, it, expect, beforeEach, vi } from 'vitest'
import type {
  AppConfig,
  NasDevice,
} from '@synology-shared-folder-unlocker/config'

vi.mock('@synology-shared-folder-unlocker/unlocker', () => ({
  store: {
    isUnlocked: true,
    isSessionValid: () => true,
    requireConfig: vi.fn(),
    requireMasterPassword: () => 'master',
    updateConfig: vi.fn(),
    removeNasStatuses: vi.fn(),
    setShareFolderStatus: vi.fn(),
    updateShareFolderStatus: vi.fn(),
  },
  startPoller: vi.fn(),
  restartPoller: vi.fn(),
  pollOnce: vi.fn(),
  unlockShareFolder: vi.fn(),
  fetchHostFingerprint: vi.fn().mockResolvedValue('test-fingerprint'),
}))

vi.mock('@synology-shared-folder-unlocker/config', async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import('@synology-shared-folder-unlocker/config')
    >()
  return {
    ...original,
    saveConfig: vi.fn(),
    loadConfig: vi.fn(),
    configExists: vi.fn().mockResolvedValue(true),
    verifyConfigPassword: vi.fn(),
  }
})

const { store } = await import('@synology-shared-folder-unlocker/unlocker')
const { loadConfig } = await import('@synology-shared-folder-unlocker/config')
const { app, resetRateLimit } = await import('./app.js')

function makeNas(overrides?: Partial<NasDevice>): NasDevice {
  return {
    id: 'nas-1',
    name: 'Test NAS',
    host: '192.168.1.1',
    port: 22,
    username: 'admin',
    password: 'secret-ssh-password',
    hostFingerprint: 'fp-abc',
    shareFolders: [],
    ...overrides,
  }
}

function makeConfig(nasList: NasDevice[] = [makeNas()]): AppConfig {
  return { pollingInterval: 120, nasList }
}

async function apiRequest(path: string, options?: RequestInit) {
  const res = await app.request(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', Cookie: 'session=valid' },
    ...options,
  })
  return {
    status: res.status,
    body: (await res.json()) as Record<string, unknown> &
      Record<string, unknown>[],
  }
}

describe('NAS API password stripping', () => {
  beforeEach(() => {
    vi.mocked(store.requireConfig).mockReturnValue(makeConfig())
    resetRateLimit()
  })

  describe('GET /api/nas', () => {
    it('does not include password in response', async () => {
      const { status, body } = await apiRequest('/nas')

      expect(status).toBe(200)
      expect(body).toHaveLength(1)
      expect(body[0]).not.toHaveProperty('password')
      expect(body[0]).toHaveProperty('name', 'Test NAS')
      expect(body[0]).toHaveProperty('host', '192.168.1.1')
      expect(body[0]).toHaveProperty('username', 'admin')
      expect(body[0]).toHaveProperty('hostFingerprint', 'fp-abc')
    })

    it('strips password from all NAS devices', async () => {
      vi.mocked(store.requireConfig).mockReturnValue(
        makeConfig([
          makeNas({ id: 'nas-1', password: 'pw1' }),
          makeNas({ id: 'nas-2', password: 'pw2' }),
        ])
      )

      const { body } = await apiRequest('/nas')

      expect(body).toHaveLength(2)
      for (const nas of body) {
        expect(nas).not.toHaveProperty('password')
      }
    })
  })

  describe('POST /api/nas', () => {
    it('does not include password in response', async () => {
      const { status, body } = await apiRequest('/nas', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New NAS',
          host: '10.0.0.1',
          port: 22,
          username: 'root',
          password: 'my-secret',
        }),
      })

      expect(status).toBe(201)
      expect(body).not.toHaveProperty('password')
      expect(body).toHaveProperty('name', 'New NAS')
      expect(body).toHaveProperty('username', 'root')
    })
  })

  describe('PUT /api/nas/:id', () => {
    it('does not include password in response', async () => {
      const { status, body } = await apiRequest('/nas/nas-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Renamed NAS' }),
      })

      expect(status).toBe(200)
      expect(body).not.toHaveProperty('password')
      expect(body).toHaveProperty('name', 'Renamed NAS')
    })

    it('does not accept username or password fields', async () => {
      const { status, body } = await apiRequest('/nas/nas-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated',
          username: 'hacker',
          password: 'evil',
        }),
      })

      expect(status).toBe(200)
      expect(body).toHaveProperty('name', 'Updated')
      expect(body).toHaveProperty('username', 'admin')
    })
  })

  describe('PUT /api/nas/:id/credentials', () => {
    it('updates username and password', async () => {
      const { status, body } = await apiRequest('/nas/nas-1/credentials', {
        method: 'PUT',
        body: JSON.stringify({
          username: 'newuser',
          password: 'newpassword',
        }),
      })

      expect(status).toBe(200)
      expect(body).not.toHaveProperty('password')
      expect(body).toHaveProperty('username', 'newuser')
    })

    it('returns 404 for unknown NAS', async () => {
      const { status } = await apiRequest('/nas/unknown/credentials', {
        method: 'PUT',
        body: JSON.stringify({
          username: 'user',
          password: 'pass',
        }),
      })

      expect(status).toBe(404)
    })
  })
})

describe('Rate limiting', () => {
  beforeEach(() => {
    resetRateLimit()
    vi.mocked(loadConfig).mockRejectedValue(new Error('Invalid password'))
  })

  it('allows requests under the limit', async () => {
    const { status } = await apiRequest('/unlock', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
    })

    expect(status).toBe(401)
  })

  it('returns 429 after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await apiRequest('/unlock', {
        method: 'POST',
        body: JSON.stringify({ password: 'wrong' }),
      })
    }

    const { status, body } = await apiRequest('/unlock', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
    })

    expect(status).toBe(429)
    expect(body).toHaveProperty('error', 'Too many attempts, try again later')
  })
})

describe('Input validation', () => {
  beforeEach(() => {
    vi.mocked(store.requireConfig).mockReturnValue(makeConfig())
    resetRateLimit()
  })

  it('POST /nas rejects missing name', async () => {
    const { status } = await apiRequest('/nas', {
      method: 'POST',
      body: JSON.stringify({
        host: '10.0.0.1',
        username: 'root',
        password: 'secret',
      }),
    })

    expect(status).toBe(400)
  })

  it('POST /nas rejects invalid port', async () => {
    const { status } = await apiRequest('/nas', {
      method: 'POST',
      body: JSON.stringify({
        name: 'NAS',
        host: '10.0.0.1',
        port: 99999,
        username: 'root',
        password: 'secret',
      }),
    })

    expect(status).toBe(400)
  })

  it('PUT /nas/:id/credentials rejects missing username', async () => {
    const { status } = await apiRequest('/nas/nas-1/credentials', {
      method: 'PUT',
      body: JSON.stringify({ password: 'secret' }),
    })

    expect(status).toBe(400)
  })

  it('PUT /nas/:id/credentials rejects missing password', async () => {
    const { status } = await apiRequest('/nas/nas-1/credentials', {
      method: 'PUT',
      body: JSON.stringify({ username: 'admin' }),
    })

    expect(status).toBe(400)
  })

  it('POST /unlock rejects missing password', async () => {
    const { status } = await apiRequest('/unlock', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    expect(status).toBe(400)
  })
})
