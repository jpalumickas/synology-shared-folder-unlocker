import { useShareFolderStatuses } from '../../../hooks/api'

export function useShareFolderStatus(nasId: string, shareFolderId: string) {
  const { statuses } = useShareFolderStatuses()

  return (
    statuses.find(
      (s) => s.nasId === nasId && s.shareFolderId === shareFolderId
    ) ?? null
  )
}
