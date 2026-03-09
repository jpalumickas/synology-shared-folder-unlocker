import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { AppConfig } from './types.ts'

let tmpDir: string
let originalEnv: string | undefined

async function loadModule() {
  vi.resetModules()
  return await import('./crypto.js')
}

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'config-test-'))
  originalEnv = process.env.DATA_PATH
  process.env.DATA_PATH = tmpDir
})

afterEach(async () => {
  process.env.DATA_PATH = originalEnv
  await rm(tmpDir, { recursive: true, force: true })
})

describe('configExists', () => {
  it('returns false when no config file exists', async () => {
    const { configExists } = await loadModule()
    expect(await configExists()).toBe(false)
  })

  it('returns true after saving a config', async () => {
    const { configExists, saveConfig } = await loadModule()
    await saveConfig({ pollingInterval: 120, nasList: [] }, 'testpassword')
    expect(await configExists()).toBe(true)
  })
})

describe('saveConfig / loadConfig', () => {
  it('round-trips a config object', async () => {
    const { saveConfig, loadConfig } = await loadModule()
    const config: AppConfig = {
      pollingInterval: 60,
      nasList: [
        {
          id: 'nas-1',
          name: 'Test NAS',
          host: '192.168.1.1',
          port: 22,
          username: 'admin',
          password: 'secret',
          shareFolders: [{ id: 'sf-1', name: 'photos', password: 'enc-pass' }],
        },
      ],
    }

    await saveConfig(config, 'mypassword')
    const loaded = await loadConfig('mypassword')
    expect(loaded).toEqual(config)
  })

  it('creates the directory if it does not exist', async () => {
    const nestedDir = join(tmpDir, 'a', 'b')
    process.env.DATA_PATH = nestedDir

    const { saveConfig } = await loadModule()
    await saveConfig({ pollingInterval: 120, nasList: [] }, 'pw')
    expect(existsSync(join(nestedDir, 'config.enc'))).toBe(true)
  })

  it('throws when loading with wrong password', async () => {
    const { saveConfig, loadConfig } = await loadModule()
    await saveConfig({ pollingInterval: 120, nasList: [] }, 'correct')
    await expect(loadConfig('wrong')).rejects.toThrow()
  })

  it('throws when config file does not exist', async () => {
    const { loadConfig } = await loadModule()
    await expect(loadConfig('any')).rejects.toThrow()
  })

  it('produces different ciphertext for the same data', async () => {
    const { saveConfig } = await loadModule()
    const config = { pollingInterval: 120, nasList: [] }

    const configFile = join(tmpDir, 'config.enc')

    await saveConfig(config, 'pw')
    const first = await readFile(configFile, 'utf8')

    await saveConfig(config, 'pw')
    const second = await readFile(configFile, 'utf8')

    expect(first).not.toBe(second)
  })
})

describe('verifyConfigPassword', () => {
  it('returns true for the correct password', async () => {
    const { saveConfig, verifyConfigPassword } = await loadModule()
    await saveConfig({ pollingInterval: 120, nasList: [] }, 'correct')
    expect(await verifyConfigPassword('correct')).toBe(true)
  })

  it('returns false for an incorrect password', async () => {
    const { saveConfig, verifyConfigPassword } = await loadModule()
    await saveConfig({ pollingInterval: 120, nasList: [] }, 'correct')
    expect(await verifyConfigPassword('wrong')).toBe(false)
  })

  it('returns false when no config file exists', async () => {
    const { verifyConfigPassword } = await loadModule()
    expect(await verifyConfigPassword('any')).toBe(false)
  })

  it('returns false when config file is corrupted', async () => {
    const { saveConfig, verifyConfigPassword } = await loadModule()
    await saveConfig({ pollingInterval: 120, nasList: [] }, 'correct')

    // Corrupt the file
    const configFile = join(tmpDir, 'config.enc')
    await writeFile(
      configFile,
      '{"salt":"bad","iv":"bad","data":"bad","tag":"bad","verifyIv":"bad","verifyData":"bad","verifyTag":"bad"}',
      'utf8'
    )

    expect(await verifyConfigPassword('correct')).toBe(false)
  })
})

describe('edge cases', () => {
  it('handles config with special characters in passwords', async () => {
    const { saveConfig, loadConfig } = await loadModule()
    const config: AppConfig = {
      pollingInterval: 60,
      nasList: [
        {
          id: 'nas-1',
          name: 'Test NAS',
          host: '192.168.1.1',
          port: 22,
          username: 'admin',
          password: 'p@ss\'w"ord!$%^&*()',
          shareFolders: [
            { id: 'sf-1', name: 'photos', password: '🔐émojì & ünîcödé' },
          ],
        },
      ],
    }

    await saveConfig(config, 'master')
    const loaded = await loadConfig('master')
    expect(loaded).toEqual(config)
  })

  it('handles empty nasList', async () => {
    const { saveConfig, loadConfig } = await loadModule()
    const config: AppConfig = { pollingInterval: 30, nasList: [] }

    await saveConfig(config, 'pw')
    expect(await loadConfig('pw')).toEqual(config)
  })

  it('handles large config with many NAS devices', async () => {
    const { saveConfig, loadConfig } = await loadModule()
    const config: AppConfig = {
      pollingInterval: 60,
      nasList: Array.from({ length: 50 }, (_, i) => ({
        id: `nas-${i}`,
        name: `NAS ${i}`,
        host: `192.168.1.${i}`,
        port: 22,
        username: 'admin',
        password: `pw-${i}`,
        shareFolders: Array.from({ length: 10 }, (_, j) => ({
          id: `sf-${i}-${j}`,
          name: `share-${j}`,
          password: `enc-${j}`,
        })),
      })),
    }

    await saveConfig(config, 'bigpassword')
    expect(await loadConfig('bigpassword')).toEqual(config)
  })

  it('handles empty string password', async () => {
    const { saveConfig, loadConfig } = await loadModule()
    const config: AppConfig = { pollingInterval: 120, nasList: [] }

    await saveConfig(config, '')
    expect(await loadConfig('')).toEqual(config)
  })

  it('handles very long password', async () => {
    const { saveConfig, loadConfig } = await loadModule()
    const config: AppConfig = { pollingInterval: 120, nasList: [] }
    const longPassword = 'a'.repeat(10_000)

    await saveConfig(config, longPassword)
    expect(await loadConfig(longPassword)).toEqual(config)
  })

  it('tampered ciphertext fails to decrypt', async () => {
    const { saveConfig, loadConfig } = await loadModule()
    await saveConfig({ pollingInterval: 120, nasList: [] }, 'pw')

    const configFile = join(tmpDir, 'config.enc')
    const raw = await readFile(configFile, 'utf8')
    const enc = JSON.parse(raw)
    // Flip a byte in the encrypted data
    const dataBytes = Buffer.from(enc.data, 'hex')
    dataBytes[0] ^= 0xff
    enc.data = dataBytes.toString('hex')
    await writeFile(configFile, JSON.stringify(enc), 'utf8')

    await expect(loadConfig('pw')).rejects.toThrow()
  })

  it('tampered auth tag fails to decrypt', async () => {
    const { saveConfig, loadConfig } = await loadModule()
    await saveConfig({ pollingInterval: 120, nasList: [] }, 'pw')

    const configFile = join(tmpDir, 'config.enc')
    const raw = await readFile(configFile, 'utf8')
    const enc = JSON.parse(raw)
    const tagBytes = Buffer.from(enc.tag, 'hex')
    tagBytes[0] ^= 0xff
    enc.tag = tagBytes.toString('hex')
    await writeFile(configFile, JSON.stringify(enc), 'utf8')

    await expect(loadConfig('pw')).rejects.toThrow()
  })

  it('loadConfig rejects malformed JSON', async () => {
    const { saveConfig, loadConfig } = await loadModule()
    await saveConfig({ pollingInterval: 120, nasList: [] }, 'pw')

    const configFile = join(tmpDir, 'config.enc')
    await writeFile(configFile, 'not json at all', 'utf8')

    await expect(loadConfig('pw')).rejects.toThrow()
  })

  it('saveConfig overwrites existing config', async () => {
    const { saveConfig, loadConfig } = await loadModule()
    const config1: AppConfig = { pollingInterval: 60, nasList: [] }
    const config2: AppConfig = { pollingInterval: 120, nasList: [] }

    await saveConfig(config1, 'pw')
    await saveConfig(config2, 'pw')
    expect(await loadConfig('pw')).toEqual(config2)
  })

  it('saveConfig with different password replaces config', async () => {
    const { saveConfig, loadConfig } = await loadModule()
    const config: AppConfig = { pollingInterval: 60, nasList: [] }

    await saveConfig(config, 'old')
    await saveConfig(config, 'new')

    await expect(loadConfig('old')).rejects.toThrow()
    expect(await loadConfig('new')).toEqual(config)
  })
})

describe('default DATA_PATH', () => {
  it('falls back to ~/.config/synology-shared-folder-unlocker when DATA_PATH is unset', async () => {
    const savedDataPath = process.env.DATA_PATH
    delete process.env.DATA_PATH

    vi.resetModules()
    const mod = await import('./crypto.js')

    // configExists should resolve (not throw) even with the default path
    const exists = await mod.configExists()
    expect(typeof exists).toBe('boolean')

    // Restore
    process.env.DATA_PATH = savedDataPath
  })
})
