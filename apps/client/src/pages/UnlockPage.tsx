import { useState } from 'react'
import { z } from 'zod'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@synology-shared-folder-unlocker/theme'
import { LockKeyhole } from 'lucide-react'
import { api } from '../lib/api'
import { useAppForm } from '../hooks/form/useForm'

export function UnlockPage({ onComplete }: { onComplete: () => void }) {
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
      setSubmitError('')
      try {
        await api.unlock(value.password)
        onComplete()
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to unlock')
      }
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <LockKeyhole className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Synology Shared Drives Unlocker</CardTitle>
              <CardDescription>
                Enter your master password to unlock.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="space-y-4"
          >
            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  label="Master Password"
                  type="password"
                  autoFocus
                />
              )}
            </form.AppField>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <form.AppForm>
              <form.SubmitButton
                label="Unlock"
                submittingLabel="Unlocking..."
                className="w-full"
              />
            </form.AppForm>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
