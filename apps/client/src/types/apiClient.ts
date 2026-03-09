import type { NasDevice } from '@synology-shared-folder-unlocker/config'

export type AddNasParams = Omit<
  NasDevice,
  'id' | 'shareFolders' | 'hostFingerprint'
>

export interface AppStatus {
  initialized: boolean
  unlocked: boolean
  sessionValid: boolean
}
