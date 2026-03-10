import { useState } from 'react'
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
} from '@synology-shared-folder-unlocker/theme'
import { EllipsisVertical, KeyRound, Trash2, Unlock } from 'lucide-react'
import type { ShareFolderInfo } from '../../../../types/apiClient'
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
  shareFolder: ShareFolderInfo
  showSeparator: boolean
}) {
  const status = useShareFolderStatus(nasId, shareFolder.id)
  const { unlockShareFolder } = useUnlockShareFolder()
  const { deleteShareFolder } = useDeleteShareFolder()
  const openEditShareFolder = useEditShareFolderDialog((s) => s.open)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs">
                <EllipsisVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => openEditShareFolder({ nasId, shareFolder })}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Update Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ConfirmDialog
            title="Delete Share Folder"
            description="This will delete this share folder configuration. This action cannot be undone."
            actionLabel="Delete"
            variant="destructive"
            onConfirm={() =>
              deleteShareFolder({ nasId, shareFolderId: shareFolder.id })
            }
            open={confirmDeleteOpen}
            onOpenChange={setConfirmDeleteOpen}
          />
        </div>
      </div>
    </div>
  )
}
