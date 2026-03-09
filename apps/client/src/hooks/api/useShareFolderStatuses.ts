import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useShareFolderStatuses() {
  return useQuery({
    queryKey: queryKeys.shareFolderStatuses,
    queryFn: () => apiClient.getShareFolderStatuses(),
    refetchInterval: 10_000,
  })
}
