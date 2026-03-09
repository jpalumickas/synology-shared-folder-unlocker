import { useState } from 'react'
import type { NasDevice } from '@synology-shared-folder-unlocker/config'
import type { EditingShareFolder } from '../types'

export function useDashboardDialogs() {
  const [showAddNas, setShowAddNas] = useState(false)
  const [editingNas, setEditingNas] = useState<NasDevice | null>(null)
  const [addShareFolderNasId, setAddShareFolderNasId] = useState<string | null>(
    null
  )
  const [editingShareFolder, setEditingShareFolder] =
    useState<EditingShareFolder | null>(null)

  return {
    showAddNas,
    setShowAddNas,
    editingNas,
    setEditingNas,
    addShareFolderNasId,
    setAddShareFolderNasId,
    editingShareFolder,
    setEditingShareFolder,
  }
}
