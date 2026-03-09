import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@synology-shared-folder-unlocker/theme'
import { useAppForm } from '../../../../hooks/form/useForm'

export function ShareFolderForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: { name: string; password: string }
  onSubmit: (data: { name: string; password: string }) => Promise<void>
  onCancel: () => void
}) {
  const [submitError, setSubmitError] = useState('')

  const form = useAppForm({
    defaultValues: {
      name: initial?.name ?? '',
      password: initial?.password ?? '',
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, 'Name is required'),
        password: initial
          ? z.string()
          : z.string().min(1, 'Password is required'),
      }),
    },
    onSubmit: async ({ value }) => {
      setSubmitError('')
      try {
        await onSubmit(value)
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed')
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      autoComplete="off"
      className="space-y-4"
    >
      <form.AppField name="name">
        {(field) => (
          <field.TextField
            label="Share Folder Name"
            placeholder="photos"
            description="The encrypted shared folder name on the Synology NAS"
          />
        )}
      </form.AppField>

      <form.AppField name="password">
        {(field) => (
          <field.TextField
            label="Encryption Password"
            type="password"
            disablePasswordManager
          />
        )}
      </form.AppField>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <form.AppForm>
          <form.SubmitButton label="Save" submittingLabel="Saving..." />
        </form.AppForm>
      </div>
    </form>
  )
}
