import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@synology-shared-folder-unlocker/theme'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useUnlockShareFolder() {
  const queryClient = useQueryClient()

  const { mutate, ...rest } = useMutation({
    mutationFn: ({
      nasId,
      shareFolderId,
    }: {
      nasId: string
      shareFolderId: string
    }) => apiClient.unlockShareFolder(nasId, shareFolderId),
    onSuccess: () => {
      toast.success('Share folder unlocked')
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareFolderStatuses,
      })
    },
    onError: () => {
      toast.error('Failed to unlock share folder')
    },
  })

  return {
    unlockShareFolder: mutate,
    ...rest,
  }
}
