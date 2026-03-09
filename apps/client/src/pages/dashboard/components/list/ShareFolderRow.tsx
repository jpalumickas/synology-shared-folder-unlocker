import { Button, Separator } from '@synology-shared-folder-unlocker/theme'
import { Pencil, Trash2, Unlock } from 'lucide-react'
import type { EncryptedShareFolder } from '@synology-shared-folder-unlocker/config'
import {
  useUnlockShareFolder,
  useDeleteShareFolder,
} from '../../../../hooks/api'
import { useShareFolderStatus } from '../../hooks/useShareFolderStatus'
import { useEditShareFolderDialog } from '../../hooks/useEditShareFolderDialog'
import { StatusBadge } from '../StatusBadge'

export function ShareFolderRow({
  nasId,
  shareFolder,
  showSeparator,
}: {
  nasId: string
  shareFolder: EncryptedShareFolder
  showSeparator: boolean
}) {
  const status = useShareFolderStatus(nasId, shareFolder.id)
  const { unlockShareFolder } = useUnlockShareFolder()
  const { deleteShareFolder } = useDeleteShareFolder()
  const openEditShareFolder = useEditShareFolderDialog((s) => s.open)

  const handleDelete = async () => {
    if (!confirm('Delete this share folder?')) {
      return
    }

    await deleteShareFolder({ nasId, shareFolderId: shareFolder.id })
  }

  return (
    <div>
      {showSeparator && <Separator className="my-1" />}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3 min-w-0">
          <StatusBadge status={status?.status ?? 'unknown'} />
          <span className="font-mono text-sm truncate">{shareFolder.name}</span>
          {status?.error && (
            <span className="text-xs text-amber-600 dark:text-amber-400 truncate">
              {status.error}
            </span>
          )}
          {status?.lastChecked && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(status.lastChecked).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex gap-1 shrink-0 ml-2">
          {status?.status !== 'unlocked' && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                unlockShareFolder({
                  nasId,
                  shareFolderId: shareFolder.id,
                })
              }
              className="text-green-700 hover:text-green-800 dark:text-green-400"
            >
              <Unlock className="h-3.5 w-3.5" />
              Unlock
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => openEditShareFolder({ nasId, shareFolder })}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
