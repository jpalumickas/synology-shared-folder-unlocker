import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'node:events'
import type {
  NasDevice,
  EncryptedShareFolder,
} from '@synology-shared-folder-unlocker/config'

// --- Configurable mock for ssh2 ---

type ExecResult = { stdout?: string; stderr?: string; code?: number }

let execResults: ExecResult[] = []
let capturedCommands: string[] = []
let shouldFailConnect = false
let connectError: Error | null = null

class MockStream extends EventEmitter {
  stderr = new EventEmitter()
  write = vi.fn()
  end = vi.fn()
}

vi.mock('ssh2', () => {
  return {
    Client: class extends EventEmitter {
      connect() {
        if (shouldFailConnect) {
          setTimeout(() => this.emit('error', connectError), 0)
        } else {
          setTimeout(() => this.emit('ready'), 0)
        }
      }
      exec(
        command: string,
        cb: (err: Error | null, stream: MockStream) => void
      ) {
        capturedCommands.push(command)
        const stream = new MockStream()
        const result = execResults.shift() ?? { stdout: '', code: 0 }
        cb(null, stream)
        if (result.stdout) stream.emit('data', Buffer.from(result.stdout))
        if (result.stderr)
          stream.stderr.emit('data', Buffer.from(result.stderr))
        stream.emit('close', result.code ?? 0)
      }
      end = vi.fn()
    },
  }
})

const nas: NasDevice = {
  id: 'nas-1',
  name: 'Test NAS',
  host: '192.168.1.1',
  port: 22,
  username: 'admin',
  password: 'naspass',
  shareFolders: [],
}

const shareFolder: EncryptedShareFolder = {
  id: 'sf-1',
  name: 'photos',
  password: 'enc-pass',
}

let checkShareFolderStatus: (typeof import('./ssh.js'))['checkShareFolderStatus']
let unlockShareFolder: (typeof import('./ssh.js'))['unlockShareFolder']

beforeEach(async () => {
  vi.resetModules()
  execResults = []
  capturedCommands = []
  shouldFailConnect = false
  connectError = null
  const mod = await import('./ssh.js')
  checkShareFolderStatus = mod.checkShareFolderStatus
  unlockShareFolder = mod.unlockShareFolder
})

describe('checkShareFolderStatus', () => {
  it('returns "unlocked" when output contains "Mounted"', async () => {
    execResults = [{ stdout: 'Status: Mounted\n' }]
    expect(await checkShareFolderStatus(nas, shareFolder)).toBe('unlocked')
  })

  it('returns "unlocked" when output contains "mounted" (lowercase)', async () => {
    execResults = [{ stdout: 'status: mounted\n' }]
    expect(await checkShareFolderStatus(nas, shareFolder)).toBe('unlocked')
  })

  it('returns "locked" when output contains "Not Mounted"', async () => {
    execResults = [{ stdout: 'Status: Not Mounted\n' }]
    expect(await checkShareFolderStatus(nas, shareFolder)).toBe('locked')
  })

  it('returns "locked" when output contains "Unmounted"', async () => {
    execResults = [{ stdout: 'Status: Unmounted\n' }]
    expect(await checkShareFolderStatus(nas, shareFolder)).toBe('locked')
  })

  it('returns "error" when output contains "not encrypted"', async () => {
    execResults = [{ stdout: 'not encrypted share\n' }]
    expect(await checkShareFolderStatus(nas, shareFolder)).toBe('error')
  })

  it('returns "error" when output contains "No such"', async () => {
    execResults = [{ stderr: 'No such shared folder\n' }]
    expect(await checkShareFolderStatus(nas, shareFolder)).toBe('error')
  })

  it('falls back to ls check - empty dir means locked', async () => {
    execResults = [{ stdout: 'some unrecognized output' }, { stdout: '' }]
    expect(await checkShareFolderStatus(nas, shareFolder)).toBe('locked')
  })

  it('falls back to ls check - non-empty dir means unlocked', async () => {
    execResults = [{ stdout: 'ambiguous output' }, { stdout: 'file.txt\n' }]
    expect(await checkShareFolderStatus(nas, shareFolder)).toBe('unlocked')
  })

  it('returns "error" on connection failure', async () => {
    shouldFailConnect = true
    connectError = new Error('Connection refused')
    expect(await checkShareFolderStatus(nas, shareFolder)).toBe('error')
  })

  it('escapes share folder name in command', async () => {
    execResults = [{ stdout: 'Status: Mounted\n' }]
    const sf = { ...shareFolder, name: "my'folder" }
    await checkShareFolderStatus(nas, sf)
    expect(capturedCommands[0]).toContain("'my'\\''folder'")
  })
})

describe('unlockShareFolder', () => {
  it('returns success when exit code is 0', async () => {
    execResults = [{ stdout: '', code: 0 }]
    const result = await unlockShareFolder(nas, shareFolder)
    expect(result.success).toBe(true)
    expect(result.message).toContain('photos')
    expect(result.message).toContain('unlocked successfully')
  })

  it('returns failure with output message on non-zero exit', async () => {
    execResults = [{ stderr: 'Permission denied', code: 1 }]
    const result = await unlockShareFolder(nas, shareFolder)
    expect(result.success).toBe(false)
    expect(result.message).toBe('Permission denied')
  })

  it('returns failure with exit code when no output', async () => {
    execResults = [{ stdout: '', stderr: '', code: 2 }]
    const result = await unlockShareFolder(nas, shareFolder)
    expect(result.success).toBe(false)
    expect(result.message).toBe('Failed with exit code 2')
  })

  it('returns failure on connection error', async () => {
    shouldFailConnect = true
    connectError = new Error('Network unreachable')
    const result = await unlockShareFolder(nas, shareFolder)
    expect(result.success).toBe(false)
    expect(result.message).toBe('Network unreachable')
  })

  it('uses sudo -S with enc_mount command', async () => {
    execResults = [{ code: 0 }]
    await unlockShareFolder(nas, shareFolder)
    expect(capturedCommands[0]).toContain('sudo -S')
    expect(capturedCommands[0]).toContain('synoshare --enc_mount')
    expect(capturedCommands[0]).toContain("'photos'")
    expect(capturedCommands[0]).toContain("'enc-pass'")
  })
})
