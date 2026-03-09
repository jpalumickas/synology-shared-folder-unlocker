import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@synology-shared-folder-unlocker/theme'
import { useAddNas } from '../../../../hooks/api'
import { useAddNasDialog } from '../../hooks/useAddNasDialog'
import { NasForm } from './NasForm'

export function AddNasDialog() {
  const isOpen = useAddNasDialog((s) => s.isOpen)
  const close = useAddNasDialog((s) => s.close)
  const { addNas } = useAddNas()

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add NAS Device</DialogTitle>
        </DialogHeader>
        <NasForm
          onSubmit={async (data) => {
            await addNas(data)
            close()
          }}
          onCancel={close}
        />
      </DialogContent>
    </Dialog>
  )
}
