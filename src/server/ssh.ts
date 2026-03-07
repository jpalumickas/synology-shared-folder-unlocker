import { Client } from 'ssh2';
import type { NasDevice, EncryptedShare } from '../shared/types.js';

interface CommandResult {
  stdout: string;
  stderr: string;
  code: number;
}

function shellEscape(str: string): string {
  return "'" + str.replace(/'/g, "'\\''") + "'";
}

function executeCommand(
  nas: NasDevice,
  command: string,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const timeout = setTimeout(() => {
      conn.end();
      reject(new Error('SSH connection timeout'));
    }, 15_000);

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timeout);
          conn.end();
          reject(err);
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
        stream.on('close', (code: number) => {
          clearTimeout(timeout);
          conn.end();
          resolve({ stdout, stderr, code: code ?? 0 });
        });
      });
    });

    conn.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    conn.connect({
      host: nas.host,
      port: nas.port,
      username: nas.username,
      password: nas.password,
      readyTimeout: 10_000,
    });
  });
}

export async function checkShareStatus(
  nas: NasDevice,
  share: EncryptedShare,
): Promise<'locked' | 'unlocked' | 'error'> {
  try {
    const result = await executeCommand(
      nas,
      `sudo /usr/syno/sbin/synoshare --enc_get_info ${shellEscape(share.name)} 2>&1 || true`,
    );
    const output = result.stdout + result.stderr;

    if (output.includes('not encrypted') || output.includes('No such')) {
      return 'error';
    }

    if (output.includes('Mounted') || output.includes('mounted')) {
      return 'unlocked';
    }

    if (
      output.includes('Not Mounted') ||
      output.includes('not mounted') ||
      output.includes('Unmounted')
    ) {
      return 'locked';
    }

    // Fallback: check if share directory has contents
    const lsResult = await executeCommand(
      nas,
      `ls -A /volume1/${shellEscape(share.name)}/ 2>/dev/null | head -1`,
    );
    return lsResult.stdout.trim() ? 'unlocked' : 'locked';
  } catch {
    return 'error';
  }
}

export async function unlockShare(
  nas: NasDevice,
  share: EncryptedShare,
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await executeCommand(
      nas,
      `sudo /usr/syno/sbin/synoshare --enc_mount ${shellEscape(share.name)} ${shellEscape(share.password)} 2>&1`,
    );

    const output = result.stdout + result.stderr;

    if (result.code === 0) {
      return {
        success: true,
        message: `Share "${share.name}" unlocked successfully`,
      };
    }

    return {
      success: false,
      message: output.trim() || `Failed with exit code ${result.code}`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
