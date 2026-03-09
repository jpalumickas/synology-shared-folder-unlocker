import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { NasDevice } from '@synology-shared-folder-unlocker/config'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useAddNas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<NasDevice, 'id' | 'shareFolders'>) =>
      apiClient.addNas(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareFolderStatuses,
      })
    },
  })
}
