import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@synology-shared-folder-unlocker/theme'
import type { UpdateNasCredentials } from '../../../../types/apiClient'
import { useAppForm } from '../../../../hooks/form/useForm'

export function CredentialsForm({
  initialUsername,
  onSubmit,
  onCancel,
}: {
  initialUsername: string
  onSubmit: (data: UpdateNasCredentials) => Promise<void>
  onCancel: () => void
}) {
  const [submitError, setSubmitError] = useState('')

  const form = useAppForm({
    defaultValues: {
      username: initialUsername,
      password: '',
    },
    validators: {
      onSubmit: z.object({
        username: z.string().min(1, 'Username is required'),
        password: z.string().min(1, 'Password is required'),
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
      <form.AppField name="username">
        {(field) => (
          <field.TextField
            label="Username"
            placeholder="admin"
            disablePasswordManager
          />
        )}
      </form.AppField>

      <form.AppField name="password">
        {(field) => (
          <field.TextField
            label="SSH Password"
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
