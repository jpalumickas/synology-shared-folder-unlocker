import { create } from 'zustand'

interface AddNasDialogState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useAddNasDialog = create<AddNasDialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
