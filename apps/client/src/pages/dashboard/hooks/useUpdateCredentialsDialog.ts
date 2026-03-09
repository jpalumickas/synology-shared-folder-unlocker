import { create } from 'zustand'
import type { NasDeviceInfo } from '../../../types/apiClient'

interface UpdateCredentialsDialogState {
  nas: NasDeviceInfo | null
  open: (nas: NasDeviceInfo) => void
  close: () => void
}

export const useUpdateCredentialsDialog = create<UpdateCredentialsDialogState>(
  (set) => ({
    nas: null,
    open: (nas) => set({ nas }),
    close: () => set({ nas: null }),
  })
)
