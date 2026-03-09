import { randomBytes } from 'node:crypto'
import type {
  AppConfig,
  EncryptedShareFolder,
  ShareFolderStatus,
} from '@synology-shared-folder-unlocker/config'

class Store {
  private config: AppConfig | null = null
  private sessionToken: string | null = null
  private masterPassword: string | null = null
  private shareFolderStatuses: Map<string, ShareFolderStatus> = new Map()

  get isUnlocked(): boolean {
    return this.config !== null
  }

  isSessionValid(token: string | undefined): boolean {
    if (!token || !this.sessionToken) {
      return false
    }

    return token === this.sessionToken
  }

  unlock(config: AppConfig, password: string): string {
    this.config = config
    this.masterPassword = password
    this.sessionToken = randomBytes(32).toString('hex')

    for (const nas of config.nasList) {
      for (const shareFolder of nas.shareFolders) {
        const key = `${nas.id}:${shareFolder.id}`
        if (!this.shareFolderStatuses.has(key)) {
          this.shareFolderStatuses.set(key, {
            nasId: nas.id,
            shareFolderId: shareFolder.id,
            shareFolderName: shareFolder.name,
            status: 'unknown',
            lastChecked: null,
          })
        }
      }
    }

    return this.sessionToken
  }

  lockUI(): void {
    this.sessionToken = null
  }

  reset(): void {
    this.config = null
    this.sessionToken = null
    this.masterPassword = null
    this.shareFolderStatuses.clear()
  }

  getConfig(): AppConfig | null {
    return this.config
  }

  requireConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Store is not unlocked')
    }

    return this.config
  }

  getMasterPassword(): string | null {
    return this.masterPassword
  }

  requireMasterPassword(): string {
    if (!this.masterPassword) {
      throw new Error('Store is not unlocked')
    }

    return this.masterPassword
  }

  setMasterPassword(password: string): void {
    this.masterPassword = password
  }

  updateConfig(config: AppConfig): void {
    this.config = config
  }

  getShareFolderStatuses(): ShareFolderStatus[] {
    return Array.from(this.shareFolderStatuses.values())
  }

  updateShareFolderStatus(
    nasId: string,
    shareFolderId: string,
    status: ShareFolderStatus['status'],
    error?: string
  ): void {
    const key = `${nasId}:${shareFolderId}`
    const existing = this.shareFolderStatuses.get(key)
    if (existing) {
      existing.status = status
      existing.lastChecked = new Date().toISOString()
      existing.error = error
    }
  }

  setShareFolderStatus(
    nasId: string,
    shareFolder: EncryptedShareFolder,
    status: ShareFolderStatus['status']
  ): void {
    const key = `${nasId}:${shareFolder.id}`
    this.shareFolderStatuses.set(key, {
      nasId,
      shareFolderId: shareFolder.id,
      shareFolderName: shareFolder.name,
      status,
      lastChecked: null,
    })
  }

  removeShareFolderStatus(nasId: string, shareFolderId: string): void {
    this.shareFolderStatuses.delete(`${nasId}:${shareFolderId}`)
  }

  removeNasStatuses(nasId: string): void {
    for (const key of this.shareFolderStatuses.keys()) {
      if (key.startsWith(`${nasId}:`)) {
        this.shareFolderStatuses.delete(key)
      }
    }
  }
}

export const store = new Store()
