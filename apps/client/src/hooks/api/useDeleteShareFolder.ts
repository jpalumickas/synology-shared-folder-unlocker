import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useDeleteShareFolder() {
  const queryClient = useQueryClient()

  const { mutateAsync, ...rest } = useMutation({
    mutationFn: ({
      nasId,
      shareFolderId,
    }: {
      nasId: string
      shareFolderId: string
    }) => apiClient.deleteShareFolder(nasId, shareFolderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareFolderStatuses,
      })
    },
  })

  return {
    deleteShareFolder: mutateAsync,
    ...rest,
  }
}
