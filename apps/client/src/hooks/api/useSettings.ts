import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useSettings() {
  const { data, ...rest } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => apiClient.getSettings(),
  })

  return {
    settings: data ?? null,
    ...rest,
  }
}
