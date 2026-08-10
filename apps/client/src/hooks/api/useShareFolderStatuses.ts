import { useQuery } from '@tanstack/react-query'
import type { ShareFolderStatus } from '@synology-shared-folder-unlocker/unlocker'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

const EMPTY_STATUSES: ShareFolderStatus[] = []

const IDLE_REFETCH_INTERVAL = 10_000
// The first poll after unlock runs in the background, so refetch more often
// while share folders are still unchecked.
const PENDING_REFETCH_INTERVAL = 2_000

export function useShareFolderStatuses() {
  const { data, ...rest } = useQuery({
    queryKey: queryKeys.shareFolderStatuses,
    queryFn: () => apiClient.getShareFolderStatuses(),
    refetchInterval: (query) => {
      const hasPending = query.state.data?.some((s) => s.status === 'unknown')

      return hasPending ? PENDING_REFETCH_INTERVAL : IDLE_REFETCH_INTERVAL
    },
  })

  return {
    statuses: data ?? EMPTY_STATUSES,
    ...rest,
  }
}
