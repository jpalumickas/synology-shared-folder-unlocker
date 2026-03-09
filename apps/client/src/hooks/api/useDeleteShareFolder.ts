import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@synology-shared-folder-unlocker/theme'
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
      toast.success('Share folder deleted')
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareFolderStatuses,
      })
    },
    onError: () => {
      toast.error('Failed to delete share folder')
    },
  })

  return {
    deleteShareFolder: mutateAsync,
    ...rest,
  }
}
