import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@synology-shared-folder-unlocker/theme'
import type { NasDevice } from '@synology-shared-folder-unlocker/config'
import type { AddNasParams } from '../../../../types/apiClient'
import { useAppForm } from '../../../../hooks/form/useForm'

export function NasForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: NasDevice
  onSubmit: (data: AddNasParams) => Promise<void>
  onCancel: () => void
}) {
  const [submitError, setSubmitError] = useState('')

  const form = useAppForm({
    defaultValues: {
      name: initial?.name ?? '',
      host: initial?.host ?? '',
      port: initial?.port ?? 22,
      username: initial?.username ?? '',
      password: initial?.password ?? '',
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, 'Name is required'),
        host: z.string().min(1, 'Host is required'),
        port: z.number().min(1, 'Invalid port').max(65535, 'Invalid port'),
        username: z.string().min(1, 'Username is required'),
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
            label="Name"
            placeholder="My NAS"
            disablePasswordManager
          />
        )}
      </form.AppField>

      <form.AppField name="host">
        {(field) => (
          <field.TextField label="Host" placeholder="192.168.1.100" />
        )}
      </form.AppField>

      <form.AppField name="port">
        {(field) => <field.NumberField label="SSH Port" />}
      </form.AppField>

      {initial?.hostFingerprint && (
        <p className="font-mono text-xs text-muted-foreground break-all">
          SHA256:{initial.hostFingerprint}
        </p>
      )}

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
