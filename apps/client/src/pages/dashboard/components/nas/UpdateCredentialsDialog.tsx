import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@synology-shared-folder-unlocker/theme'
import { useUpdateNasCredentials } from '../../../../hooks/api'
import { useUpdateCredentialsDialog } from '../../hooks/useUpdateCredentialsDialog'
import { CredentialsForm } from './CredentialsForm'

export function UpdateCredentialsDialog() {
  const nas = useUpdateCredentialsDialog((s) => s.nas)
  const close = useUpdateCredentialsDialog((s) => s.close)
  const { updateNasCredentials } = useUpdateNasCredentials()

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
          <DialogTitle>Update Credentials</DialogTitle>
        </DialogHeader>
        {nas && (
          <CredentialsForm
            initialUsername={nas.username}
            onSubmit={async (data) => {
              await updateNasCredentials({ id: nas.id, data })
              close()
            }}
            onCancel={close}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
