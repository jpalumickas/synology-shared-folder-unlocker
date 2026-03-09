import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@synology-shared-folder-unlocker/theme'
import { useAddShareFolder } from '../../../../hooks/api'
import { useAddShareFolderDialog } from '../../hooks/useAddShareFolderDialog'
import { ShareFolderForm } from './ShareFolderForm'

export function AddShareFolderDialog() {
  const nasId = useAddShareFolderDialog((s) => s.nasId)
  const close = useAddShareFolderDialog((s) => s.close)
  const { addShareFolder } = useAddShareFolder()

  return (
    <Dialog
      open={!!nasId}
      onOpenChange={(open) => {
        if (!open) {
          close()
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
            close()
          }}
          onCancel={close}
        />
      </DialogContent>
    </Dialog>
  )
}
