import { Button } from '@synology-shared-folder-unlocker/theme'
import { Plus } from 'lucide-react'
import { useNasList } from '../../../../hooks/api'
import { useAddNasDialog } from '../../hooks/useAddNasDialog'
import { NasCard } from './NasCard'
import { NasEmptyState } from './NasEmptyState'

export function NasList() {
  const { nasList, isLoading } = useNasList()
  const openAddNas = useAddNasDialog((s) => s.open)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">NAS Devices</h2>
        <Button size="sm" onClick={openAddNas}>
          <Plus className="h-4 w-4" />
          Add NAS
        </Button>
      </div>

      {nasList.length === 0 ? (
        <NasEmptyState />
      ) : (
        <div className="space-y-4">
          {nasList.map((nas) => (
            <NasCard key={nas.id} nas={nas} />
          ))}
        </div>
      )}
    </>
  )
}
