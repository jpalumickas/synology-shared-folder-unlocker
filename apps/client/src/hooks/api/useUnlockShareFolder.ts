import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useUnlockShareFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      nasId,
      shareFolderId,
    }: {
      nasId: string
      shareFolderId: string
    }) => apiClient.unlockShareFolder(nasId, shareFolderId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareFolderStatuses,
      })
    },
  })
}
