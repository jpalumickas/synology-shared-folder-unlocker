import { describe, it, expect, beforeEach, vi } from 'vitest'
import type {
  AppConfig,
  EncryptedShareFolder,
} from '@synology-shared-folder-unlocker/config'

async function loadStore() {
  vi.resetModules()
  const mod = await import('./store.js')
  return mod.store
}

const makeConfig = (overrides?: Partial<AppConfig>): AppConfig => ({
  pollingInterval: 120,
  nasList: [
    {
      id: 'nas-1',
      name: 'NAS One',
      host: '192.168.1.1',
      port: 22,
      username: 'admin',
      password: 'pw',
      hostKeyType: 'ssh-ed25519',
      hostFingerprint: 'fp-1',
      shareFolders: [
        { id: 'sf-1', name: 'photos', password: 'enc1' },
        { id: 'sf-2', name: 'docs', password: 'enc2' },
      ],
    },
  ],
  ...overrides,
})

describe('Store', () => {
  let store: Awaited<ReturnType<typeof loadStore>>

  beforeEach(async () => {
    store = await loadStore()
  })

  describe('initial state', () => {
    it('is locked by default', () => {
      expect(store.isUnlocked).toBe(false)
    })

    it('has no config', () => {
      expect(store.getConfig()).toBeNull()
    })

    it('has no master password', () => {
      expect(store.getMasterPassword()).toBeNull()
    })

    it('has no share folder statuses', () => {
      expect(store.getShareFolderStatuses()).toEqual([])
    })

    it('session is invalid for any token', () => {
      expect(store.isSessionValid('anything')).toBe(false)
      expect(store.isSessionValid(undefined)).toBe(false)
    })
  })

  describe('unlock', () => {
    it('sets config and master password', () => {
      const config = makeConfig()
      store.unlock(config, 'master')
      expect(store.isUnlocked).toBe(true)
      expect(store.getConfig()).toBe(config)
      expect(store.getMasterPassword()).toBe('master')
    })

    it('returns a session token', () => {
      const token = store.unlock(makeConfig(), 'pw')
      expect(token).toBeTypeOf('string')
      expect(token.length).toBe(64) // 32 bytes hex
    })

    it('generates unique tokens per unlock', () => {
      const t1 = store.unlock(makeConfig(), 'pw')
      store.reset()
      const t2 = store.unlock(makeConfig(), 'pw')
      expect(t1).not.toBe(t2)
    })

    it('initializes share folder statuses as unknown', () => {
      store.unlock(makeConfig(), 'pw')
      const statuses = store.getShareFolderStatuses()
      expect(statuses).toHaveLength(2)
      expect(statuses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nasId: 'nas-1',
            shareFolderId: 'sf-1',
            shareFolderName: 'photos',
            status: 'unknown',
            lastChecked: null,
          }),
          expect.objectContaining({
            nasId: 'nas-1',
            shareFolderId: 'sf-2',
            shareFolderName: 'docs',
            status: 'unknown',
            lastChecked: null,
          }),
        ])
      )
    })

    it('does not overwrite existing share folder statuses on re-unlock', () => {
      const config = makeConfig()
      store.unlock(config, 'pw')
      store.updateShareFolderStatus('nas-1', 'sf-1', 'unlocked')

      store.unlock(config, 'pw')
      const st = store
        .getShareFolderStatuses()
        .find((s) => s.shareFolderId === 'sf-1')
      expect(st?.status).toBe('unlocked')
    })
  })

  describe('isSessionValid', () => {
    it('returns true for valid token', () => {
      const token = store.unlock(makeConfig(), 'pw')
      expect(store.isSessionValid(token)).toBe(true)
    })

    it('returns false for wrong token', () => {
      store.unlock(makeConfig(), 'pw')
      expect(store.isSessionValid('bad')).toBe(false)
    })

    it('returns false for undefined', () => {
      store.unlock(makeConfig(), 'pw')
      expect(store.isSessionValid(undefined)).toBe(false)
    })
  })

  describe('lockUI', () => {
    it('invalidates session but keeps config', () => {
      const token = store.unlock(makeConfig(), 'pw')
      store.lockUI()
      expect(store.isUnlocked).toBe(true)
      expect(store.isSessionValid(token)).toBe(false)
      expect(store.getConfig()).not.toBeNull()
    })
  })

  describe('reset', () => {
    it('clears everything', () => {
      const token = store.unlock(makeConfig(), 'pw')
      store.reset()
      expect(store.isUnlocked).toBe(false)
      expect(store.getConfig()).toBeNull()
      expect(store.getMasterPassword()).toBeNull()
      expect(store.isSessionValid(token)).toBe(false)
      expect(store.getShareFolderStatuses()).toEqual([])
    })
  })

  describe('updateConfig', () => {
    it('replaces config', () => {
      store.unlock(makeConfig(), 'pw')
      const newConfig = makeConfig({ pollingInterval: 60 })
      store.updateConfig(newConfig)
      expect(store.getConfig()).toBe(newConfig)
    })
  })

  describe('share folder status management', () => {
    beforeEach(() => {
      store.unlock(makeConfig(), 'pw')
    })

    it('updateShareFolderStatus updates status and lastChecked', () => {
      store.updateShareFolderStatus('nas-1', 'sf-1', 'unlocked')
      const st = store
        .getShareFolderStatuses()
        .find((s) => s.shareFolderId === 'sf-1')
      expect(st?.status).toBe('unlocked')
      expect(st?.lastChecked).not.toBeNull()
    })

    it('updateShareFolderStatus sets error', () => {
      store.updateShareFolderStatus('nas-1', 'sf-1', 'error', 'timeout')
      const st = store
        .getShareFolderStatuses()
        .find((s) => s.shareFolderId === 'sf-1')
      expect(st?.status).toBe('error')
      expect(st?.error).toBe('timeout')
    })

    it('updateShareFolderStatus is a no-op for unknown key', () => {
      store.updateShareFolderStatus('nas-x', 'sf-x', 'unlocked')
      expect(store.getShareFolderStatuses()).toHaveLength(2)
    })

    it('setShareFolderStatus adds or replaces a status entry', () => {
      const sf: EncryptedShareFolder = {
        id: 'sf-new',
        name: 'music',
        password: 'enc',
      }
      store.setShareFolderStatus('nas-1', sf, 'locked')
      const st = store
        .getShareFolderStatuses()
        .find((s) => s.shareFolderId === 'sf-new')
      expect(st).toEqual({
        nasId: 'nas-1',
        shareFolderId: 'sf-new',
        shareFolderName: 'music',
        status: 'locked',
        lastChecked: null,
      })
    })

    it('removeShareFolderStatus removes a single status', () => {
      store.removeShareFolderStatus('nas-1', 'sf-1')
      expect(store.getShareFolderStatuses()).toHaveLength(1)
      expect(
        store.getShareFolderStatuses().find((s) => s.shareFolderId === 'sf-1')
      ).toBeUndefined()
    })

    it('removeNasStatuses removes all statuses for a NAS', () => {
      store.removeNasStatuses('nas-1')
      expect(store.getShareFolderStatuses()).toHaveLength(0)
    })

    it('removeNasStatuses does not affect other NAS', () => {
      const sf: EncryptedShareFolder = {
        id: 'sf-other',
        name: 'other',
        password: 'x',
      }
      store.setShareFolderStatus('nas-2', sf, 'unknown')
      store.removeNasStatuses('nas-1')
      expect(store.getShareFolderStatuses()).toHaveLength(1)
      expect(store.getShareFolderStatuses()[0].nasId).toBe('nas-2')
    })

    it('setShareFolderStatus overwrites existing entry', () => {
      const sf: EncryptedShareFolder = {
        id: 'sf-1',
        name: 'photos-renamed',
        password: 'enc1',
      }
      store.setShareFolderStatus('nas-1', sf, 'locked')
      const st = store
        .getShareFolderStatuses()
        .find((s) => s.shareFolderId === 'sf-1')
      expect(st?.shareFolderName).toBe('photos-renamed')
      expect(st?.status).toBe('locked')
    })

    it('updateShareFolderStatus clears previous error when status changes', () => {
      store.updateShareFolderStatus('nas-1', 'sf-1', 'error', 'timeout')
      store.updateShareFolderStatus('nas-1', 'sf-1', 'unlocked')
      const st = store
        .getShareFolderStatuses()
        .find((s) => s.shareFolderId === 'sf-1')
      expect(st?.status).toBe('unlocked')
      expect(st?.error).toBeUndefined()
    })

    it('removeShareFolderStatus is a no-op for unknown key', () => {
      store.removeShareFolderStatus('nas-x', 'sf-x')
      expect(store.getShareFolderStatuses()).toHaveLength(2)
    })

    it('removeNasStatuses is a no-op for unknown NAS', () => {
      store.removeNasStatuses('nas-unknown')
      expect(store.getShareFolderStatuses()).toHaveLength(2)
    })
  })

  describe('edge cases', () => {
    it('unlock with empty nasList creates no statuses', () => {
      store.unlock({ pollingInterval: 60, nasList: [] }, 'pw')
      expect(store.getShareFolderStatuses()).toHaveLength(0)
      expect(store.isUnlocked).toBe(true)
    })

    it('updateConfig does not affect session or statuses', () => {
      const token = store.unlock(makeConfig(), 'pw')
      store.updateShareFolderStatus('nas-1', 'sf-1', 'unlocked')
      const newConfig = makeConfig({ pollingInterval: 30 })
      store.updateConfig(newConfig)

      expect(store.isSessionValid(token)).toBe(true)
      expect(store.getMasterPassword()).toBe('pw')
      const st = store
        .getShareFolderStatuses()
        .find((s) => s.shareFolderId === 'sf-1')
      expect(st?.status).toBe('unlocked')
    })

    it('multiple NAS devices with multiple share folders', () => {
      const config = makeConfig({
        nasList: [
          {
            id: 'nas-1',
            name: 'NAS One',
            host: '192.168.1.1',
            port: 22,
            username: 'admin',
            password: 'pw',
            hostKeyType: 'ssh-ed25519',
            hostFingerprint: 'fp-1',
            shareFolders: [{ id: 'sf-1', name: 'photos', password: 'enc1' }],
          },
          {
            id: 'nas-2',
            name: 'NAS Two',
            host: '192.168.1.2',
            port: 22,
            username: 'admin',
            password: 'pw2',
            hostKeyType: 'ssh-ed25519',
            hostFingerprint: 'fp-2',
            shareFolders: [
              { id: 'sf-3', name: 'music', password: 'enc3' },
              { id: 'sf-4', name: 'videos', password: 'enc4' },
            ],
          },
        ],
      })
      store.unlock(config, 'pw')
      expect(store.getShareFolderStatuses()).toHaveLength(3)

      store.removeNasStatuses('nas-1')
      expect(store.getShareFolderStatuses()).toHaveLength(2)
      expect(
        store.getShareFolderStatuses().every((s) => s.nasId === 'nas-2')
      ).toBe(true)
    })

    it('lockUI then unlock generates new session', () => {
      const token1 = store.unlock(makeConfig(), 'pw')
      store.lockUI()
      const token2 = store.unlock(makeConfig(), 'pw')
      expect(token1).not.toBe(token2)
      expect(store.isSessionValid(token1)).toBe(false)
      expect(store.isSessionValid(token2)).toBe(true)
    })

    it('reset then unlock starts fresh', () => {
      store.unlock(makeConfig(), 'pw')
      store.updateShareFolderStatus('nas-1', 'sf-1', 'unlocked')
      store.reset()
      store.unlock(makeConfig(), 'newpw')

      expect(store.getMasterPassword()).toBe('newpw')
      const statuses = store.getShareFolderStatuses()
      expect(statuses.every((s) => s.status === 'unknown')).toBe(true)
    })
  })
})
