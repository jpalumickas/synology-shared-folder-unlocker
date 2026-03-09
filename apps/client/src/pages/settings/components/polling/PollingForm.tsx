import { useState } from 'react'
import { z } from 'zod'
import { useAppForm } from '../../../../hooks/form/useForm'
import { useUpdateSettings } from '../../../../hooks/api'

export function PollingForm({ initialInterval }: { initialInterval: number }) {
  const [submitError, setSubmitError] = useState('')
  const [saved, setSaved] = useState(false)
  const { updateSettings } = useUpdateSettings()

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
        await updateSettings({
          pollingInterval: value.interval,
        })
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
