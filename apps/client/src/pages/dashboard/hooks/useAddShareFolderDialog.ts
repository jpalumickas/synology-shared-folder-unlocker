import { create } from 'zustand'

interface AddShareFolderDialogState {
  nasId: string | null
  open: (nasId: string) => void
  close: () => void
}

export const useAddShareFolderDialog = create<AddShareFolderDialogState>(
  (set) => ({
    nasId: null,
    open: (nasId) => set({ nasId }),
    close: () => set({ nasId: null }),
  })
)
