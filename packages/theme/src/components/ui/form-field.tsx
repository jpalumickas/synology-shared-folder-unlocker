import type { ReactNode } from 'react'
import { Field, FieldLabel, FieldDescription, FieldError } from './field'

interface FormFieldProps {
  label: string
  error?: string
  description?: string
  children: ReactNode
}

export function FormField({
  label,
  error,
  description,
  children,
}: FormFieldProps) {
  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel>{label}</FieldLabel>
      {children}
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
