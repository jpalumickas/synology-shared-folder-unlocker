import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@synology-shared-folder-unlocker/theme'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useUpdateShareFolder() {
  const queryClient = useQueryClient()

  const { mutateAsync, ...rest } = useMutation({
    mutationFn: ({
      nasId,
      shareFolderId,
      password,
    }: {
      nasId: string
      shareFolderId: string
      password: string
    }) => apiClient.updateShareFolderPassword(nasId, shareFolderId, password),
    onSuccess: () => {
      toast.success('Share folder password updated')
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
    },
    onError: () => {
      toast.error('Failed to update share folder password')
    },
  })

  return {
    updateShareFolder: mutateAsync,
    ...rest,
  }
}
