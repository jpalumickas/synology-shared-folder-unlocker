import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@synology-shared-folder-unlocker/theme'
import { useUpdateShareFolder } from '../../../../hooks/api'
import { ShareFolderForm } from './ShareFolderForm'
import type { EditingShareFolder } from '../../types'

export function EditShareFolderDialog({
  editing,
  onClose,
}: {
  editing: EditingShareFolder | null
  onClose: () => void
}) {
  const { updateShareFolder } = useUpdateShareFolder()

  return (
    <Dialog
      open={!!editing}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Share Folder</DialogTitle>
        </DialogHeader>
        {editing && (
          <ShareFolderForm
            initial={editing.shareFolder}
            onSubmit={async (data) => {
              await updateShareFolder({
                nasId: editing.nasId,
                shareFolderId: editing.shareFolder.id,
                data,
              })
              onClose()
            }}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
