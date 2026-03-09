import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useNasList() {
  return useQuery({
    queryKey: queryKeys.nasList,
    queryFn: () => apiClient.getNasList(),
  })
}
