import { Badge, cn } from '@synology-shared-folder-unlocker/theme'
import type { ShareFolderStatus } from '@synology-shared-folder-unlocker/unlocker'

export function StatusBadge({
  status,
}: {
  status: ShareFolderStatus['status']
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 capitalize',
        status === 'unlocked' &&
          'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400',
        status === 'locked' &&
          'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400',
        status === 'error' &&
          'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'unlocked' && 'bg-green-500',
          status === 'locked' && 'bg-red-500',
          status === 'error' && 'bg-amber-500',
          status === 'unknown' && 'bg-muted-foreground'
        )}
      />
      {status}
    </Badge>
  )
}
