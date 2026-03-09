import { useState } from 'react'
import { z } from 'zod'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@synology-shared-folder-unlocker/theme'
import { Shield } from 'lucide-react'
import { api } from '../lib/api'
import { useAppForm, getFieldError } from '../hooks/form/useForm'
import { FormWrapper } from '../components/FormWrapper'

export function InitPage({ onComplete }: { onComplete: () => void }) {
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
        await api.init(value.password)
        onComplete()
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
            <form.Field name="password">
              {(field) => (
                <FormWrapper
                  label="Master Password"
                  error={getFieldError(field)}
                >
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    autoFocus
                  />
                </FormWrapper>
              )}
            </form.Field>

            <form.Field name="confirm">
              {(field) => (
                <FormWrapper
                  label="Confirm Password"
                  error={getFieldError(field)}
                >
                  <Input
                    type="password"
                    placeholder="Re-enter password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </FormWrapper>
              )}
            </form.Field>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Initializing...' : 'Initialize'}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
