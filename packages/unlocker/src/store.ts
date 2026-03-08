import { randomBytes } from 'node:crypto';
import type { AppConfig, EncryptedShare, ShareStatus } from '@synology-unlocker/config';

class Store {
  private config: AppConfig | null = null;
  private sessionToken: string | null = null;
  private masterPassword: string | null = null;
  private shareStatuses: Map<string, ShareStatus> = new Map();

  get isUnlocked(): boolean {
    return this.config !== null;
  }

  isSessionValid(token: string | undefined): boolean {
    if (!token || !this.sessionToken) return false;
    return token === this.sessionToken;
  }

  unlock(config: AppConfig, password: string): string {
    this.config = config;
    this.masterPassword = password;
    this.sessionToken = randomBytes(32).toString('hex');

    for (const nas of config.nasList) {
      for (const share of nas.shares) {
        const key = `${nas.id}:${share.id}`;
        if (!this.shareStatuses.has(key)) {
          this.shareStatuses.set(key, {
            nasId: nas.id,
            shareId: share.id,
            shareName: share.name,
            status: 'unknown',
            lastChecked: null,
          });
        }
      }
    }

    return this.sessionToken;
  }

  lockUI(): void {
    this.sessionToken = null;
  }

  reset(): void {
    this.config = null;
    this.sessionToken = null;
    this.masterPassword = null;
    this.shareStatuses.clear();
  }

  getConfig(): AppConfig | null {
    return this.config;
  }

  getMasterPassword(): string | null {
    return this.masterPassword;
  }

  updateConfig(config: AppConfig): void {
    this.config = config;
  }

  getShareStatuses(): ShareStatus[] {
    return Array.from(this.shareStatuses.values());
  }

  updateShareStatus(
    nasId: string,
    shareId: string,
    status: ShareStatus['status'],
    error?: string,
  ): void {
    const key = `${nasId}:${shareId}`;
    const existing = this.shareStatuses.get(key);
    if (existing) {
      existing.status = status;
      existing.lastChecked = new Date().toISOString();
      existing.error = error;
    }
  }

  setShareStatus(
    nasId: string,
    share: EncryptedShare,
    status: ShareStatus['status'],
  ): void {
    const key = `${nasId}:${share.id}`;
    this.shareStatuses.set(key, {
      nasId,
      shareId: share.id,
      shareName: share.name,
      status,
      lastChecked: null,
    });
  }

  removeShareStatus(nasId: string, shareId: string): void {
    this.shareStatuses.delete(`${nasId}:${shareId}`);
  }

  removeNasStatuses(nasId: string): void {
    for (const key of this.shareStatuses.keys()) {
      if (key.startsWith(`${nasId}:`)) {
        this.shareStatuses.delete(key);
      }
    }
  }
}

export const store = new Store();
