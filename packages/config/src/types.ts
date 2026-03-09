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

export interface EncryptedShareFolder {
  id: string
  name: string
  password: string
}

export interface AppConfig {
  pollingInterval: number
  nasList: NasDevice[]
}
