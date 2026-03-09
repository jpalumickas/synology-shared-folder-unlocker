import type { NasDevice } from '@synology-shared-folder-unlocker/config'

export type NasDeviceInfo = Omit<NasDevice, 'password'>

export type AddNasParams = Omit<
  NasDevice,
  'id' | 'shareFolders' | 'hostFingerprint'
>

export type UpdateNasCredentials = Pick<NasDevice, 'username' | 'password'>

export interface AppStatus {
  initialized: boolean
  unlocked: boolean
  sessionValid: boolean
}
