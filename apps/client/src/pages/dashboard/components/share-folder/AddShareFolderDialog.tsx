import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@synology-shared-folder-unlocker/theme'
import { useAddShareFolder } from '../../../../hooks/api'
import { ShareFolderForm } from './ShareFolderForm'

export function AddShareFolderDialog({
  nasId,
  onClose,
}: {
  nasId: string | null
  onClose: () => void
}) {
  const { addShareFolder } = useAddShareFolder()

  return (
    <Dialog
      open={!!nasId}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Encrypted Share Folder</DialogTitle>
        </DialogHeader>
        <ShareFolderForm
          onSubmit={async (data) => {
            if (!nasId) {
              return
            }

            await addShareFolder({ nasId, data })
            onClose()
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
