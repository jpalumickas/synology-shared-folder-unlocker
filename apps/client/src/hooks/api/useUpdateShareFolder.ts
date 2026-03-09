import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EncryptedShareFolder } from '@synology-shared-folder-unlocker/config'
import { toast } from '@synology-shared-folder-unlocker/theme'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useUpdateShareFolder() {
  const queryClient = useQueryClient()

  const { mutateAsync, ...rest } = useMutation({
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
      toast.success('Share folder updated')
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
    },
    onError: () => {
      toast.error('Failed to update share folder')
    },
  })

  return {
    updateShareFolder: mutateAsync,
    ...rest,
  }
}
