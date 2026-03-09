import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@synology-shared-folder-unlocker/theme'
import { useAddNas } from '../../../../hooks/api'
import { NasForm } from './NasForm'

export function AddNasDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { addNas } = useAddNas()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add NAS Device</DialogTitle>
        </DialogHeader>
        <NasForm
          onSubmit={async (data) => {
            await addNas(data)
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
