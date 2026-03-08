import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
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
})
