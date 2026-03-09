import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  cn,
} from '@synology-shared-folder-unlocker/theme'
import { FolderLock, Pencil, Server, Trash2 } from 'lucide-react'
import type { NasDevice } from '@synology-shared-folder-unlocker/config'
import { useDeleteNas } from '../../../../hooks/api'
import { ShareFolderRow } from './ShareFolderRow'
import type { EditingShareFolder } from '../../types'

export function NasCard({
  nas,
  onEdit,
  onAddShareFolder,
  onEditShareFolder,
}: {
  nas: NasDevice
  onEdit: () => void
  onAddShareFolder: () => void
  onEditShareFolder: (editing: EditingShareFolder) => void
}) {
  const { deleteNas } = useDeleteNas()

  const handleDelete = async () => {
    if (!confirm('Delete this NAS device and all its share folders?')) {
      return
    }

    await deleteNas(nas.id)
  }

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
            </p>
          </div>
        </div>
        <CardAction>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={onAddShareFolder}>
              <FolderLock className="h-3.5 w-3.5" />
              Add Folder
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
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
                onEdit={() => onEditShareFolder({ nasId: nas.id, shareFolder })}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
