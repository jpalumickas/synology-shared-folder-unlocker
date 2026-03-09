import {
  Button,
  Card,
  CardContent,
} from '@synology-shared-folder-unlocker/theme'
import { Plus, Server } from 'lucide-react'

export function NasEmptyState({ onAddNas }: { onAddNas: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
          <Server className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No NAS devices configured</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add a NAS device to get started.
        </p>
        <Button onClick={onAddNas}>
          <Plus className="h-4 w-4" />
          Add NAS Device
        </Button>
      </CardContent>
    </Card>
  )
}
