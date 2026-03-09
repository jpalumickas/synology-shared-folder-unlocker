import { useState } from 'react'
import { z } from 'zod'
import { useRouter, useNavigate } from '@tanstack/react-router'
import { apiClient } from '../../../services/apiClient'
import { useAppForm } from '../../../hooks/form/useForm'

export function UnlockForm() {
  const router = useRouter()
  const navigate = useNavigate()
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
        await apiClient.unlock(value.password)
        await router.invalidate()
        await navigate({ to: '/' })
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to unlock')
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
          <field.TextField label="Master Password" type="password" autoFocus />
        )}
      </form.AppField>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <form.AppForm>
        <form.SubmitButton
          label="Unlock"
          submittingLabel="Unlocking..."
          className="w-full"
        />
      </form.AppForm>
    </form>
  )
}
