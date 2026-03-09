import { useState } from 'react'
import { z } from 'zod'
import { useRouter, useNavigate } from '@tanstack/react-router'
import { apiClient } from '../../../services/apiClient'
import { useAppForm } from '../../../hooks/form/useForm'

export function InitForm() {
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

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <form.AppForm>
        <form.SubmitButton
          label="Initialize"
          submittingLabel="Initializing..."
          className="w-full"
        />
      </form.AppForm>
    </form>
  )
}
