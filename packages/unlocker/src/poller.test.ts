import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AppConfig } from '@synology-shared-folder-unlocker/config'

const mockCheckShareFolderStatus = vi.fn()
const mockUnlockShareFolder = vi.fn()

vi.mock('./ssh.js', () => ({
  checkShareFolderStatus: (...args: unknown[]) =>
    mockCheckShareFolderStatus(...args),
  unlockShareFolder: (...args: unknown[]) => mockUnlockShareFolder(...args),
}))

const config: AppConfig = {
  pollingInterval: 60,
  nasList: [
    {
      id: 'nas-1',
      name: 'NAS One',
      host: '192.168.1.1',
      port: 22,
      username: 'admin',
      password: 'pw',
      shareFolders: [
        { id: 'sf-1', name: 'photos', password: 'enc1' },
        { id: 'sf-2', name: 'docs', password: 'enc2' },
      ],
    },
  ],
}

let store: (typeof import('./store.js'))['store']
let pollOnce: (typeof import('./poller.js'))['pollOnce']
let startPoller: (typeof import('./poller.js'))['startPoller']
let stopPoller: (typeof import('./poller.js'))['stopPoller']
let restartPoller: (typeof import('./poller.js'))['restartPoller']

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  mockCheckShareFolderStatus.mockReset()
  mockUnlockShareFolder.mockReset()

  const storeMod = await import('./store.js')
  store = storeMod.store
  const pollerMod = await import('./poller.js')
  pollOnce = pollerMod.pollOnce
  startPoller = pollerMod.startPoller
  stopPoller = pollerMod.stopPoller
  restartPoller = pollerMod.restartPoller
})

afterEach(() => {
  stopPoller()
  vi.useRealTimers()
})

describe('pollOnce', () => {
  it('does nothing when store has no config', async () => {
    await pollOnce()
    expect(mockCheckShareFolderStatus).not.toHaveBeenCalled()
  })

  it('checks status for each share folder', async () => {
    store.unlock(config, 'pw')
    mockCheckShareFolderStatus.mockResolvedValue('unlocked')

    await pollOnce()

    expect(mockCheckShareFolderStatus).toHaveBeenCalledTimes(2)
    expect(mockCheckShareFolderStatus).toHaveBeenCalledWith(
      config.nasList[0],
      config.nasList[0].shareFolders[0]
    )
    expect(mockCheckShareFolderStatus).toHaveBeenCalledWith(
      config.nasList[0],
      config.nasList[0].shareFolders[1]
    )
  })

  it('updates statuses to unlocked when already unlocked', async () => {
    store.unlock(config, 'pw')
    mockCheckShareFolderStatus.mockResolvedValue('unlocked')

    await pollOnce()

    const statuses = store.getShareFolderStatuses()
    expect(statuses.every((s) => s.status === 'unlocked')).toBe(true)
    expect(mockUnlockShareFolder).not.toHaveBeenCalled()
  })

  it('attempts unlock when share folder is locked', async () => {
    store.unlock(config, 'pw')
    mockCheckShareFolderStatus.mockResolvedValue('locked')
    mockUnlockShareFolder.mockResolvedValue({
      success: true,
      message: 'unlocked',
    })

    await pollOnce()

    expect(mockUnlockShareFolder).toHaveBeenCalledTimes(2)
    const statuses = store.getShareFolderStatuses()
    expect(statuses.every((s) => s.status === 'unlocked')).toBe(true)
  })

  it('sets error status when unlock fails', async () => {
    store.unlock(config, 'pw')
    mockCheckShareFolderStatus.mockResolvedValue('locked')
    mockUnlockShareFolder.mockResolvedValue({
      success: false,
      message: 'bad password',
    })

    await pollOnce()

    const statuses = store.getShareFolderStatuses()
    expect(statuses.every((s) => s.status === 'error')).toBe(true)
    expect(statuses[0].error).toBe('bad password')
  })

  it('sets error status when check throws', async () => {
    store.unlock(config, 'pw')
    mockCheckShareFolderStatus.mockRejectedValue(new Error('SSH failed'))

    await pollOnce()

    const statuses = store.getShareFolderStatuses()
    expect(statuses.every((s) => s.status === 'error')).toBe(true)
    expect(statuses[0].error).toBe('SSH failed')
  })

  it('updates status to error when check returns error', async () => {
    store.unlock(config, 'pw')
    mockCheckShareFolderStatus.mockResolvedValue('error')

    await pollOnce()

    const statuses = store.getShareFolderStatuses()
    expect(statuses.every((s) => s.status === 'error')).toBe(true)
    expect(mockUnlockShareFolder).not.toHaveBeenCalled()
  })
})

describe('startPoller / stopPoller / restartPoller', () => {
  it('does nothing when store has no config', () => {
    startPoller()
    expect(mockCheckShareFolderStatus).not.toHaveBeenCalled()
  })

  it('runs pollOnce immediately on start', async () => {
    store.unlock(config, 'pw')
    mockCheckShareFolderStatus.mockResolvedValue('unlocked')

    startPoller()
    // Flush the initial pollOnce microtasks
    await vi.advanceTimersByTimeAsync(0)

    expect(mockCheckShareFolderStatus).toHaveBeenCalledTimes(2)
  })

  it('runs pollOnce again after interval', async () => {
    store.unlock(config, 'pw')
    mockCheckShareFolderStatus.mockResolvedValue('unlocked')

    startPoller()
    await vi.advanceTimersByTimeAsync(0)
    mockCheckShareFolderStatus.mockClear()

    await vi.advanceTimersByTimeAsync(60_000)

    expect(mockCheckShareFolderStatus).toHaveBeenCalledTimes(2)
  })

  it('stopPoller stops the interval', async () => {
    store.unlock(config, 'pw')
    mockCheckShareFolderStatus.mockResolvedValue('unlocked')

    startPoller()
    await vi.advanceTimersByTimeAsync(0)
    mockCheckShareFolderStatus.mockClear()

    stopPoller()
    await vi.advanceTimersByTimeAsync(120_000)

    expect(mockCheckShareFolderStatus).not.toHaveBeenCalled()
  })

  it('restartPoller stops and starts again', async () => {
    store.unlock(config, 'pw')
    mockCheckShareFolderStatus.mockResolvedValue('unlocked')

    startPoller()
    await vi.advanceTimersByTimeAsync(0)
    mockCheckShareFolderStatus.mockClear()

    restartPoller()
    await vi.advanceTimersByTimeAsync(0)

    expect(mockCheckShareFolderStatus).toHaveBeenCalledTimes(2)
  })

  it('uses pollingInterval from config', async () => {
    const fastConfig: AppConfig = { ...config, pollingInterval: 30 }
    store.unlock(fastConfig, 'pw')
    mockCheckShareFolderStatus.mockResolvedValue('unlocked')

    startPoller()
    await vi.advanceTimersByTimeAsync(0)
    mockCheckShareFolderStatus.mockClear()

    // Advance 30s - should fire
    await vi.advanceTimersByTimeAsync(30_000)
    expect(mockCheckShareFolderStatus).toHaveBeenCalledTimes(2)
  })
})
