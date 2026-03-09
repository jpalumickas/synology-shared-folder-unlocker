import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@synology-shared-folder-unlocker/theme'
import type { NasDevice } from '@synology-shared-folder-unlocker/config'
import { useUpdateNas } from '../../../../hooks/api'
import { NasForm } from './NasForm'

export function EditNasDialog({
  nas,
  onClose,
}: {
  nas: NasDevice | null
  onClose: () => void
}) {
  const { updateNas } = useUpdateNas()

  return (
    <Dialog
      open={!!nas}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
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
              await updateNas({ id: nas.id, data })
              onClose()
            }}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
