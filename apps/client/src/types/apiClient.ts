import type {
  EncryptedShareFolder,
  NasDevice,
} from '@synology-shared-folder-unlocker/config'

export type ShareFolderInfo = Omit<EncryptedShareFolder, 'password'>

export type NasDeviceInfo = Omit<NasDevice, 'password'> & {
  shareFolders: ShareFolderInfo[]
}

export type AddNasParams = Omit<
  NasDevice,
  'id' | 'shareFolders' | 'hostKeyType' | 'hostFingerprint'
>

export type UpdateNasCredentials = Pick<NasDevice, 'username' | 'password'>

export interface AppStatus {
  initialized: boolean
  unlocked: boolean
  sessionValid: boolean
}
