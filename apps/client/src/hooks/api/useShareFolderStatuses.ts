import { useQuery } from '@tanstack/react-query'
import type { ShareFolderStatus } from '@synology-shared-folder-unlocker/config'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

const EMPTY_STATUSES: ShareFolderStatus[] = []

export function useShareFolderStatuses() {
  const { data, ...rest } = useQuery({
    queryKey: queryKeys.shareFolderStatuses,
    queryFn: () => apiClient.getShareFolderStatuses(),
    refetchInterval: 10_000,
  })

  return {
    statuses: data ?? EMPTY_STATUSES,
    ...rest,
  }
}
