import { create } from 'zustand'
import type { NasDeviceInfo } from '../../../types/apiClient'

interface EditNasDialogState {
  nas: NasDeviceInfo | null
  open: (nas: NasDeviceInfo) => void
  close: () => void
}

export const useEditNasDialog = create<EditNasDialogState>((set) => ({
  nas: null,
  open: (nas) => set({ nas }),
  close: () => set({ nas: null }),
}))
