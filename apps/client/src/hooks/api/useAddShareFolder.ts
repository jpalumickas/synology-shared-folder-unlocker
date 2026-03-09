import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EncryptedShareFolder } from '@synology-shared-folder-unlocker/config'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useAddShareFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      nasId,
      data,
    }: {
      nasId: string
      data: Omit<EncryptedShareFolder, 'id'>
    }) => apiClient.addShareFolder(nasId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareFolderStatuses,
      })
    },
  })
}
