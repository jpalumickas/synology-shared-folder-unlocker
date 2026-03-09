import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@synology-shared-folder-unlocker/theme'
import { useUpdateShareFolder } from '../../../../hooks/api'
import { useEditShareFolderDialog } from '../../hooks/useEditShareFolderDialog'
import { ShareFolderForm } from './ShareFolderForm'

export function EditShareFolderDialog() {
  const editing = useEditShareFolderDialog((s) => s.editing)
  const close = useEditShareFolderDialog((s) => s.close)
  const { updateShareFolder } = useUpdateShareFolder()

  return (
    <Dialog
      open={!!editing}
      onOpenChange={(open) => {
        if (!open) {
          close()
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
              close()
            }}
            onCancel={close}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
