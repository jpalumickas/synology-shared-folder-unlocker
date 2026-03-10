import { useState } from 'react'
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  cn,
} from '@synology-shared-folder-unlocker/theme'
import {
  EllipsisVertical,
  FolderLock,
  KeyRound,
  Pencil,
  Server,
  Trash2,
} from 'lucide-react'
import type { NasDeviceInfo } from '../../../../types/apiClient'
import { useDeleteNas } from '../../../../hooks/api'
import { useEditNasDialog } from '../../hooks/useEditNasDialog'
import { useUpdateCredentialsDialog } from '../../hooks/useUpdateCredentialsDialog'
import { useAddShareFolderDialog } from '../../hooks/useAddShareFolderDialog'
import { ShareFolderRow } from './ShareFolderRow'

export function NasCard({ nas }: { nas: NasDeviceInfo }) {
  const { deleteNas } = useDeleteNas()
  const openEditNas = useEditNasDialog((s) => s.open)
  const openUpdateCredentials = useUpdateCredentialsDialog((s) => s.open)
  const openAddShareFolder = useAddShareFolderDialog((s) => s.open)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Server className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">{nas.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {nas.username}@{nas.host}:{nas.port}
              {nas.hostKeyType && (
                <span className="ml-2 font-mono text-xs">
                  {nas.hostKeyType}
                </span>
              )}
            </p>
          </div>
        </div>
        <CardAction>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddShareFolder(nas.id)}
            >
              <FolderLock className="h-3.5 w-3.5" />
              Add Folder
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditNas(nas)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openUpdateCredentials(nas)}>
                  <KeyRound className="h-3.5 w-3.5" />
                  Update Credentials
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
              title="Delete NAS Device"
              description="This will delete this NAS device and all its share folders. This action cannot be undone."
              actionLabel="Delete"
              variant="destructive"
              onConfirm={() => deleteNas(nas.id)}
              open={confirmDeleteOpen}
              onOpenChange={setConfirmDeleteOpen}
            />
          </div>
        </CardAction>
      </CardHeader>

      {nas.shareFolders.length > 0 && <Separator />}

      <CardContent className={cn(nas.shareFolders.length === 0 && 'py-0 pb-2')}>
        {nas.shareFolders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No encrypted share folders configured.
          </p>
        ) : (
          <div className="space-y-1">
            {nas.shareFolders.map((shareFolder, index) => (
              <ShareFolderRow
                key={shareFolder.id}
                nasId={nas.id}
                shareFolder={shareFolder}
                showSeparator={index > 0}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
