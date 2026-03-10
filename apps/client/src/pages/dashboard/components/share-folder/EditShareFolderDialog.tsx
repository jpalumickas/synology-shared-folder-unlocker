import { useState } from 'react'
import { z } from 'zod'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@synology-shared-folder-unlocker/theme'
import { useUpdateShareFolder } from '../../../../hooks/api'
import { useAppForm } from '../../../../hooks/form/useForm'
import { useEditShareFolderDialog } from '../../hooks/useEditShareFolderDialog'

export function EditShareFolderDialog() {
  const editing = useEditShareFolderDialog((s) => s.editing)
  const close = useEditShareFolderDialog((s) => s.close)
  const { updateShareFolder } = useUpdateShareFolder()
  const [submitError, setSubmitError] = useState('')

  const form = useAppForm({
    defaultValues: {
      password: '',
    },
    validators: {
      onSubmit: z.object({
        password: z.string().min(1, 'Password is required'),
      }),
    },
    onSubmit: async ({ value }) => {
      if (!editing) {
        return
      }

      setSubmitError('')
      try {
        await updateShareFolder({
          nasId: editing.nasId,
          shareFolderId: editing.shareFolder.id,
          password: value.password,
        })
        close()
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed')
      }
    },
  })

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
          <DialogTitle>
            Update Password — {editing?.shareFolder.name}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          autoComplete="off"
          className="space-y-4"
        >
          <form.AppField name="password">
            {(field) => (
              <field.TextField
                label="Encryption Password"
                type="password"
                disablePasswordManager
              />
            )}
          </form.AppField>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <form.AppForm>
              <form.SubmitButton label="Update" submittingLabel="Updating..." />
            </form.AppForm>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
