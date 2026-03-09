import { createFormHookContexts, createFormHook } from '@tanstack/react-form'

const { fieldContext, formContext } = createFormHookContexts()

export const { useAppForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
})

export function getFieldError(field: {
  state: { meta: { errors: unknown[] } }
}): string | undefined {
  if (field.state.meta.errors.length === 0) return undefined
  const err = field.state.meta.errors[0]
  if (!err) return undefined
  if (typeof err === 'string') return err
  if (typeof err === 'object' && 'message' in (err as object))
    return (err as { message: string }).message
  return String(err)
}
