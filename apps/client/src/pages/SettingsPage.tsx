import { useState, useEffect } from 'react'
import { z } from 'zod'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from '@synology-shared-folder-unlocker/theme'
import { ArrowLeft, Clock, Shield } from 'lucide-react'
import { api } from '../lib/api'
import { useAppForm } from '../hooks/form/useForm'

function PollingForm({ initialInterval }: { initialInterval: number }) {
  const [submitError, setSubmitError] = useState('')
  const [saved, setSaved] = useState(false)

  const form = useAppForm({
    defaultValues: {
      interval: initialInterval,
    },
    validators: {
      onSubmit: z.object({
        interval: z.number().min(10, 'Minimum interval is 10 seconds'),
      }),
    },
    onSubmit: async ({ value }) => {
      setSubmitError('')
      setSaved(false)
      try {
        await api.updateSettings({ pollingInterval: value.interval })
        setSaved(true)
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to save')
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.AppField name="interval">
        {(field) => (
          <field.NumberField
            label="Polling Interval (seconds)"
            min={10}
            description="How often to check and auto-unlock share folders (minimum 10s)"
          />
        )}
      </form.AppField>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Settings saved.
        </p>
      )}

      <div className="flex justify-end">
        <form.AppForm>
          <form.SubmitButton label="Save" submittingLabel="Saving..." />
        </form.AppForm>
      </div>
    </form>
  )
}

function ChangePasswordForm() {
  const [submitError, setSubmitError] = useState('')
  const [saved, setSaved] = useState(false)

  const form = useAppForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: z
        .object({
          currentPassword: z.string().min(1, 'Current password is required'),
          newPassword: z
            .string()
            .min(8, 'New password must be at least 8 characters'),
          confirmPassword: z.string().min(1, 'Please confirm your password'),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        }),
    },
    onSubmit: async ({ value }) => {
      setSubmitError('')
      setSaved(false)
      try {
        await api.changePassword(value.currentPassword, value.newPassword)
        setSaved(true)
        form.reset()
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Failed to change password'
        )
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
      <form.AppField name="currentPassword">
        {(field) => (
          <field.TextField
            label="Current Password"
            type="password"
            disablePasswordManager
          />
        )}
      </form.AppField>

      <Separator />

      <form.AppField name="newPassword">
        {(field) => (
          <field.TextField
            label="New Password"
            type="password"
            placeholder="At least 8 characters"
            disablePasswordManager
          />
        )}
      </form.AppField>

      <form.AppField name="confirmPassword">
        {(field) => (
          <field.TextField
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            disablePasswordManager
          />
        )}
      </form.AppField>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Password changed successfully.
        </p>
      )}

      <div className="flex justify-end">
        <form.AppForm>
          <form.SubmitButton
            label="Change Password"
            submittingLabel="Changing..."
          />
        </form.AppForm>
      </div>
    </form>
  )
}

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const [pollingInterval, setPollingInterval] = useState<number | null>(null)

  useEffect(() => {
    api.getSettings().then((s) => setPollingInterval(s.pollingInterval))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Polling</CardTitle>
                <CardDescription>
                  Configure how often share folders are checked and
                  auto-unlocked.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pollingInterval !== null ? (
              <PollingForm initialInterval={pollingInterval} />
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Security</CardTitle>
                <CardDescription>
                  Change the master password used to encrypt your configuration.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
