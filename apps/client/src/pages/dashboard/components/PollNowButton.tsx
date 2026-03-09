import { Button, cn } from '@synology-shared-folder-unlocker/theme'
import { RefreshCw } from 'lucide-react'
import { usePollNow } from '../../../hooks/api'

export function PollNowButton() {
  const { pollNow, isPending } = usePollNow()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => pollNow()}
      disabled={isPending}
    >
      <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
      <span className="hidden sm:inline">
        {isPending ? 'Checking...' : 'Check Now'}
      </span>
    </Button>
  )
}
