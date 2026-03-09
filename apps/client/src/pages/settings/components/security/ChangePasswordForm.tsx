import { useState } from 'react'
import { z } from 'zod'
import { Separator } from '@synology-shared-folder-unlocker/theme'
import { useAppForm } from '../../../../hooks/form/useForm'
import { useChangePassword } from '../../../../hooks/api'

export function ChangePasswordForm() {
  const [submitError, setSubmitError] = useState('')
  const [saved, setSaved] = useState(false)
  const { changePassword } = useChangePassword()

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
        await changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        })
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
