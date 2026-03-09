import { useQuery } from '@tanstack/react-query'
import type { NasDeviceInfo } from '../../types/apiClient'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

const EMPTY_NAS_LIST: NasDeviceInfo[] = []

export function useNasList() {
  const { data, ...rest } = useQuery({
    queryKey: queryKeys.nasList,
    queryFn: () => apiClient.getNasList(),
  })

  return {
    nasList: data ?? EMPTY_NAS_LIST,
    ...rest,
  }
}
