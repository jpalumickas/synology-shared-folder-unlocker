import { createHash } from 'node:crypto'
import { Client } from 'ssh2'
import type { ServerHostKeyAlgorithm } from 'ssh2'
import type {
  NasDevice,
  EncryptedShareFolder,
} from '@synology-shared-folder-unlocker/config'

interface CommandResult {
  stdout: string
  stderr: string
  code: number
}

export interface HostKeyInfo {
  type: string
  fingerprint: string
}

function hashHostKey(key: Buffer): string {
  return createHash('sha256').update(key).digest('base64').replace(/=+$/, '')
}

function shellEscape(str: string): string {
  return "'" + str.replace(/'/g, "'\\''") + "'"
}

function executeCommand(
  nas: NasDevice,
  command: string,
  stdinData?: string
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    const timeout = setTimeout(() => {
      conn.end()
      reject(new Error('SSH connection timeout'))
    }, 15_000)

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timeout)
          conn.end()
          reject(err)
          return
        }

        let stdout = ''
        let stderr = ''

        stream.on('data', (data: Buffer) => {
          stdout += data.toString()
        })
        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString()
        })
        stream.on('close', (code: number) => {
          clearTimeout(timeout)
          conn.end()
          resolve({ stdout, stderr, code: code ?? 0 })
        })

        if (stdinData !== undefined) {
          stream.write(stdinData + '\n')
          stream.end()
        }
      })
    })

    conn.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })

    conn.connect({
      host: nas.host,
      port: nas.port,
      username: nas.username,
      password: nas.password,
      readyTimeout: 10_000,
      algorithms: {
        serverHostKey: [nas.hostKeyType as ServerHostKeyAlgorithm],
      },
      hostVerifier: (key: Buffer) => hashHostKey(key) === nas.hostFingerprint,
    })
  })
}

export function fetchHostKey(host: string, port: number): Promise<HostKeyInfo> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    const timeout = setTimeout(() => {
      conn.end()
      reject(new Error('SSH connection timeout'))
    }, 10_000)

    conn.connect({
      host,
      port,
      username: 'root',
      readyTimeout: 10_000,
      hostVerifier: (key: Buffer) => {
        clearTimeout(timeout)

        // SSH wire format: 4-byte big-endian length + key type string
        const typeLen = key.readUInt32BE(0)
        const keyType = key.subarray(4, 4 + typeLen).toString('ascii')
        const fingerprint = hashHostKey(key)

        conn.end()
        resolve({ type: keyType, fingerprint })
        return false
      },
    })

    conn.on('error', (err) => {
      clearTimeout(timeout)
      if (
        err.message === 'Handshake failed: host fingerprint verification failed'
      ) {
        return
      }

      reject(err)
    })
  })
}

function sudoCommand(
  nas: NasDevice,
  command: string,
  extraStdin?: string
): Promise<CommandResult> {
  const stdinData =
    extraStdin !== undefined ? nas.password + '\n' + extraStdin : nas.password

  return executeCommand(nas, `sudo -S ${command} 2>&1`, stdinData)
}

export async function checkShareFolderStatus(
  nas: NasDevice,
  shareFolder: EncryptedShareFolder
): Promise<'locked' | 'unlocked' | 'error'> {
  try {
    const result = await sudoCommand(
      nas,
      `/usr/syno/sbin/synoshare --enc_get_info ${shellEscape(shareFolder.name)}`
    )
    const output = result.stdout + result.stderr

    if (output.includes('not encrypted') || output.includes('No such')) {
      return 'error'
    }

    if (
      output.includes('Not Mounted') ||
      output.includes('not mounted') ||
      output.includes('Unmounted')
    ) {
      return 'locked'
    }

    if (output.includes('Mounted') || output.includes('mounted')) {
      return 'unlocked'
    }

    // Fallback: check if share folder directory has contents
    const lsResult = await executeCommand(
      nas,
      `ls -A /volume1/${shellEscape(shareFolder.name)}/ 2>/dev/null | head -1`
    )
    return lsResult.stdout.trim() ? 'unlocked' : 'locked'
  } catch {
    return 'error'
  }
}

export async function unlockShareFolder(
  nas: NasDevice,
  shareFolder: EncryptedShareFolder
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sudoCommand(
      nas,
      `sh -c 'read -r pw && /usr/syno/sbin/synoshare --enc_mount "$1" "$pw"' -- ${shellEscape(shareFolder.name)}`,
      shareFolder.password
    )

    const output = result.stdout + result.stderr

    if (result.code === 0) {
      return {
        success: true,
        message: `Share folder "${shareFolder.name}" unlocked successfully`,
      }
    }

    return {
      success: false,
      message: output.trim() || `Failed with exit code ${result.code}`,
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
