import type { ReactNode } from 'react'
import { Label } from '@synology-shared-folder-unlocker/theme'

interface FormWrapperProps {
  label: string
  error?: string
  description?: string
  children: ReactNode
}

export function FormWrapper({
  label,
  error,
  description,
  children,
}: FormWrapperProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
