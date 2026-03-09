import { useSettings } from '../../../hooks/api'

export function PollingStatus() {
  const { settings } = useSettings()

  return (
    <p className="text-xs text-muted-foreground mt-6 text-center">
      Polling every {settings?.pollingInterval ?? '...'}s. Share folders are
      checked and automatically unlocked in the background.
    </p>
  )
}
