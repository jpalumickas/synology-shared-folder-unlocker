import { store } from './store.js';
import { checkShareFolderStatus, unlockShareFolder } from './ssh.js';

let pollInterval: ReturnType<typeof setInterval> | null = null;

export async function pollOnce(): Promise<void> {
  const config = store.getConfig();
  if (!config) return;

  for (const nas of config.nasList) {
    for (const shareFolder of nas.shareFolders) {
      try {
        const status = await checkShareFolderStatus(nas, shareFolder);
        store.updateShareFolderStatus(nas.id, shareFolder.id, status);

        if (status === 'locked') {
          console.log(
            `[Poller] Share folder "${shareFolder.name}" on ${nas.name} is locked, attempting unlock...`,
          );
          const result = await unlockShareFolder(nas, shareFolder);
          if (result.success) {
            console.log(`[Poller] ${result.message}`);
            store.updateShareFolderStatus(nas.id, shareFolder.id, 'unlocked');
          } else {
            console.error(
              `[Poller] Failed to unlock "${shareFolder.name}": ${result.message}`,
            );
            store.updateShareFolderStatus(
              nas.id,
              shareFolder.id,
              'error',
              result.message,
            );
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error(
          `[Poller] Error checking "${shareFolder.name}" on ${nas.name}: ${msg}`,
        );
        store.updateShareFolderStatus(nas.id, shareFolder.id, 'error', msg);
      }
    }
  }
}

export function startPoller(): void {
  stopPoller();

  const config = store.getConfig();
  if (!config) return;

  const intervalMs = (config.pollingInterval || 120) * 1000;
  console.log(
    `[Poller] Starting with interval ${config.pollingInterval || 120}s`,
  );

  pollOnce();
  pollInterval = setInterval(pollOnce, intervalMs);
}

export function stopPoller(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log('[Poller] Stopped');
  }
}

export function restartPoller(): void {
  startPoller();
}
