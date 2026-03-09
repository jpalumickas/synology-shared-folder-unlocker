import { useState } from 'react'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@synology-shared-folder-unlocker/theme'
import { Shield } from 'lucide-react'
import { useRouter, useNavigate } from '@tanstack/react-router'
import { apiClient } from '../services/apiClient'
import { useAppForm } from '../hooks/form/useForm'

export function InitPage() {
  const router = useRouter()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')

  const form = useAppForm({
    defaultValues: {
      password: '',
      confirm: '',
    },
    validators: {
      onSubmit: z
        .object({
          password: z.string().min(8, 'Password must be at least 8 characters'),
          confirm: z.string().min(1, 'Please confirm your password'),
        })
        .refine((data) => data.password === data.confirm, {
          message: 'Passwords do not match',
          path: ['confirm'],
        }),
    },
    onSubmit: async ({ value }) => {
      setSubmitError('')
      try {
        await apiClient.init(value.password)
        await router.invalidate()
        await navigate({ to: '/' })
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Failed to initialize'
        )
      }
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Synology Shared Drives Unlocker</CardTitle>
              <CardDescription>
                Set a master password to encrypt your configuration.
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
                  placeholder="At least 8 characters"
                  autoFocus
                />
              )}
            </form.AppField>

            <form.AppField name="confirm">
              {(field) => (
                <field.TextField
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                />
              )}
            </form.AppField>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <form.AppForm>
              <form.SubmitButton
                label="Initialize"
                submittingLabel="Initializing..."
                className="w-full"
              />
            </form.AppForm>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
