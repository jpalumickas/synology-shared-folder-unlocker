export interface ShareFolderStatus {
  nasId: string
  shareFolderId: string
  shareFolderName: string
  status: 'unknown' | 'locked' | 'unlocked' | 'error'
  lastChecked: string | null
  error?: string
}
