import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => apiClient.getSettings(),
  })
}
