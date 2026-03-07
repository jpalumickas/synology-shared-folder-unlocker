import { store } from './store.js';
import { checkShareStatus, unlockShare } from './ssh.js';

let pollInterval: ReturnType<typeof setInterval> | null = null;

export async function pollOnce(): Promise<void> {
  const config = store.getConfig();
  if (!config) return;

  for (const nas of config.nasList) {
    for (const share of nas.shares) {
      try {
        const status = await checkShareStatus(nas, share);
        store.updateShareStatus(nas.id, share.id, status);

        if (status === 'locked') {
          console.log(
            `[Poller] Share "${share.name}" on ${nas.name} is locked, attempting unlock...`,
          );
          const result = await unlockShare(nas, share);
          if (result.success) {
            console.log(`[Poller] ${result.message}`);
            store.updateShareStatus(nas.id, share.id, 'unlocked');
          } else {
            console.error(
              `[Poller] Failed to unlock "${share.name}": ${result.message}`,
            );
            store.updateShareStatus(
              nas.id,
              share.id,
              'error',
              result.message,
            );
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error(
          `[Poller] Error checking "${share.name}" on ${nas.name}: ${msg}`,
        );
        store.updateShareStatus(nas.id, share.id, 'error', msg);
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
