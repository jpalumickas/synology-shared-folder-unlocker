import { z } from 'zod'
import { useAppForm } from '../../../../hooks/form/useForm'
import { useUpdateSettings } from '../../../../hooks/api'

export function PollingForm({ initialInterval }: { initialInterval: number }) {
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
      await updateSettings({
        pollingInterval: value.interval,
      })
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

      <div className="flex justify-end">
        <form.AppForm>
          <form.SubmitButton label="Save" submittingLabel="Saving..." />
        </form.AppForm>
      </div>
    </form>
  )
}
