import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@synology-shared-folder-unlocker/theme'
import { Clock } from 'lucide-react'
import { useSettings } from '../../../../hooks/api'
import { PollingForm } from './PollingForm'

export function PollingSection() {
  const { settings, isLoading } = useSettings()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Polling</CardTitle>
            <CardDescription>
              Configure how often share folders are checked and auto-unlocked.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : settings ? (
          <PollingForm initialInterval={settings.pollingInterval} />
        ) : null}
      </CardContent>
    </Card>
  )
}
