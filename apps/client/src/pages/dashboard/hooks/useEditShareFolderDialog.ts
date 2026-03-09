import { create } from 'zustand'
import type { EditingShareFolder } from '../types'

interface EditShareFolderDialogState {
  editing: EditingShareFolder | null
  open: (editing: EditingShareFolder) => void
  close: () => void
}

export const useEditShareFolderDialog = create<EditShareFolderDialogState>(
  (set) => ({
    editing: null,
    open: (editing) => set({ editing }),
    close: () => set({ editing: null }),
  })
)
