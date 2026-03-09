import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@synology-shared-folder-unlocker/theme'
import { useUpdateNas } from '../../../../hooks/api'
import { useEditNasDialog } from '../../hooks/useEditNasDialog'
import { NasForm } from './NasForm'

export function EditNasDialog() {
  const nas = useEditNasDialog((s) => s.nas)
  const close = useEditNasDialog((s) => s.close)
  const { updateNas } = useUpdateNas()

  return (
    <Dialog
      open={!!nas}
      onOpenChange={(open) => {
        if (!open) {
          close()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit NAS Device</DialogTitle>
        </DialogHeader>
        {nas && (
          <NasForm
            initial={nas}
            onSubmit={async (data) => {
              const { name, host, port } = data
              await updateNas({ id: nas.id, data: { name, host, port } })
              close()
            }}
            onCancel={close}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
