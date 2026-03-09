import { useQuery } from '@tanstack/react-query'
import type { NasDevice } from '@synology-shared-folder-unlocker/config'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

const EMPTY_NAS_LIST: NasDevice[] = []

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
