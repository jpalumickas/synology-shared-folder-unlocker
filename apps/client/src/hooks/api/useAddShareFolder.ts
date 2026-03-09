import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EncryptedShareFolder } from '@synology-shared-folder-unlocker/config'
import { toast } from '@synology-shared-folder-unlocker/theme'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useAddShareFolder() {
  const queryClient = useQueryClient()

  const { mutateAsync, ...rest } = useMutation({
    mutationFn: ({
      nasId,
      data,
    }: {
      nasId: string
      data: Omit<EncryptedShareFolder, 'id'>
    }) => apiClient.addShareFolder(nasId, data),
    onSuccess: () => {
      toast.success('Share folder added')
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareFolderStatuses,
      })
    },
    onError: () => {
      toast.error('Failed to add share folder')
    },
  })

  return {
    addShareFolder: mutateAsync,
    ...rest,
  }
}
