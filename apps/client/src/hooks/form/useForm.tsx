import { createFormHookContexts, createFormHook } from '@tanstack/react-form'
import {
  Input,
  Button,
  FormField,
} from '@synology-shared-folder-unlocker/theme'

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

function getFieldError(field: {
  state: { meta: { errors: unknown[] } }
}): string | undefined {
  if (field.state.meta.errors.length === 0) {
    return undefined
  }

  const err = field.state.meta.errors[0]

  if (!err) {
    return undefined
  }

  if (typeof err === 'string') {
    return err
  }

  if (typeof err === 'object' && 'message' in (err as object)) {
    return (err as { message: string }).message
  }
  return String(err)
}

function TextField({
  label,
  type,
  placeholder,
  description,
  autoFocus,
  disablePasswordManager,
}: {
  label: string
  type?: 'text' | 'password'
  placeholder?: string
  description?: string
  autoFocus?: boolean
  disablePasswordManager?: boolean
}) {
  const field = useFieldContext<string>()
  const error = getFieldError(field)

  return (
    <FormField label={label} error={error} description={description}>
      <Input
        type={type}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
        {...(disablePasswordManager
          ? { autoComplete: 'off' as const, 'data-1p-ignore': true }
          : {})}
      />
    </FormField>
  )
}

function NumberField({
  label,
  min,
  description,
}: {
  label: string
  min?: number
  description?: string
}) {
  const field = useFieldContext<number>()
  const error = getFieldError(field)

  return (
    <FormField label={label} error={error} description={description}>
      <Input
        type="number"
        min={min}
        value={field.state.value}
        onChange={(e) => field.handleChange(Number(e.target.value))}
        onBlur={field.handleBlur}
      />
    </FormField>
  )
}

function SubmitButton({
  label,
  submittingLabel,
  className,
}: {
  label: string
  submittingLabel?: string
  className?: string
}) {
  const form = useFormContext()

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting} className={className}>
          {isSubmitting ? (submittingLabel ?? label) : label}
        </Button>
      )}
    </form.Subscribe>
  )
}

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    NumberField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
})
