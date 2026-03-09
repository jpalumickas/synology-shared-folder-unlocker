import { create } from 'zustand'
import type { NasDevice } from '@synology-shared-folder-unlocker/config'

interface EditNasDialogState {
  nas: NasDevice | null
  open: (nas: NasDevice) => void
  close: () => void
}

export const useEditNasDialog = create<EditNasDialogState>((set) => ({
  nas: null,
  open: (nas) => set({ nas }),
  close: () => set({ nas: null }),
}))
