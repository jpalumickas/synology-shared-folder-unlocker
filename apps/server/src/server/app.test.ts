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
const { app } = await import('./app.js')

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

    it('does not include password when updating credentials', async () => {
      const { status, body } = await apiRequest('/nas/nas-1', {
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
  })
})
