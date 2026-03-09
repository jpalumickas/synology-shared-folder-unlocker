export interface NasDevice {
  id: string
  name: string
  host: string
  port: number
  username: string
  password: string
  hostFingerprint: string
  shareFolders: EncryptedShareFolder[]
}

export type AddNasParams = Omit<
  NasDevice,
  'id' | 'shareFolders' | 'hostFingerprint'
>

export interface EncryptedShareFolder {
  id: string
  name: string
  password: string
}

export interface AppConfig {
  pollingInterval: number
  nasList: NasDevice[]
}

export interface ShareFolderStatus {
  nasId: string
  shareFolderId: string
  shareFolderName: string
  status: 'unknown' | 'locked' | 'unlocked' | 'error'
  lastChecked: string | null
  error?: string
}

export interface AppStatus {
  initialized: boolean
  unlocked: boolean
  sessionValid: boolean
}
