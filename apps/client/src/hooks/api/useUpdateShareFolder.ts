import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EncryptedShareFolder } from '@synology-shared-folder-unlocker/config'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useUpdateShareFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      nasId,
      shareFolderId,
      data,
    }: {
      nasId: string
      shareFolderId: string
      data: Partial<EncryptedShareFolder>
    }) => apiClient.updateShareFolder(nasId, shareFolderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
    },
  })
}
