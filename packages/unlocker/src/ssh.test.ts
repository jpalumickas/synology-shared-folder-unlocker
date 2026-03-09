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
let shouldHangConnect = false
let shouldExecFail = false
let execError: Error | null = null
let capturedStdinData: string[] = []

class MockStream extends EventEmitter {
  stderr = new EventEmitter()
  write = vi.fn()
  end = vi.fn()
}

vi.mock('ssh2', () => {
  return {
    Client: class extends EventEmitter {
      connect() {
        if (shouldHangConnect) {
          // Do nothing - simulates a hanging connection for timeout testing
        } else if (shouldFailConnect) {
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
        if (shouldExecFail) {
          cb(execError as Error, null as unknown as MockStream)
          return
        }
        const stream = new MockStream()
        stream.write = vi.fn((...args: unknown[]) => {
          capturedStdinData.push(String(args[0]))
        })
        const result = execResults.shift() ?? { stdout: '', code: 0 }
        cb(null, stream)
        if (result.stdout) stream.emit('data', Buffer.from(result.stdout))
        if (result.stderr)
          stream.stderr.emit('data', Buffer.from(result.stderr))
        stream.emit('close', 'code' in result ? result.code : 0)
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
  capturedStdinData = []
  shouldFailConnect = false
  connectError = null
  shouldHangConnect = false
  shouldExecFail = false
  execError = null
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

  it('returns failure with non-Error throw', async () => {
    shouldFailConnect = true
    connectError = 'string error' as unknown as Error
    const result = await unlockShareFolder(nas, shareFolder)
    expect(result.success).toBe(false)
    expect(result.message).toBe('Unknown error')
  })

  it('escapes share folder password in unlock command', async () => {
    execResults = [{ code: 0 }]
    const sf = { ...shareFolder, password: "pass'word" }
    await unlockShareFolder(nas, sf)
    expect(capturedCommands[0]).toContain("'pass'\\''word'")
  })
})

describe('executeCommand / SSH edge cases', () => {
  it('rejects with timeout when connection hangs', async () => {
    vi.useFakeTimers()
    shouldHangConnect = true
    const promise = checkShareFolderStatus(nas, shareFolder)
    await vi.advanceTimersByTimeAsync(15_001)
    // checkShareFolderStatus catches the error and returns 'error'
    expect(await promise).toBe('error')
    vi.useRealTimers()
  })

  it('rejects when exec returns an error', async () => {
    shouldExecFail = true
    execError = new Error('exec failed')
    expect(await checkShareFolderStatus(nas, shareFolder)).toBe('error')
  })

  it('unlockShareFolder handles exec error', async () => {
    shouldExecFail = true
    execError = new Error('command not found')
    const result = await unlockShareFolder(nas, shareFolder)
    expect(result.success).toBe(false)
    expect(result.message).toBe('command not found')
  })

  it('sends password via stdin for sudo commands', async () => {
    execResults = [{ stdout: 'Status: Mounted\n' }]
    await checkShareFolderStatus(nas, shareFolder)
    expect(capturedStdinData[0]).toContain('naspass')
  })

  it('defaults code to 0 when close event passes null', async () => {
    // The mock always passes a code, so we test the null code path via unlockShareFolder
    // When code is undefined/null, it should be treated as 0 (success)
    execResults = [{ stdout: '', code: undefined as unknown as number }]
    const result = await unlockShareFolder(nas, shareFolder)
    expect(result.success).toBe(true)
  })

  it('handles stderr output in checkShareFolderStatus', async () => {
    execResults = [{ stderr: 'not mounted\n' }]
    expect(await checkShareFolderStatus(nas, shareFolder)).toBe('locked')
  })

  it('returns "locked" for "not mounted" (lowercase)', async () => {
    execResults = [{ stdout: 'Status: not mounted\n' }]
    expect(await checkShareFolderStatus(nas, shareFolder)).toBe('locked')
  })
})
