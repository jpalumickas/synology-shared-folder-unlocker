import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { NasDevice } from '@synology-shared-folder-unlocker/config'
import { toast } from '@synology-shared-folder-unlocker/theme'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useAddNas() {
  const queryClient = useQueryClient()

  const { mutateAsync, ...rest } = useMutation({
    mutationFn: (
      data: Omit<NasDevice, 'id' | 'shareFolders' | 'hostFingerprint'>
    ) => apiClient.addNas(data),
    onSuccess: () => {
      toast.success('NAS device added')
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareFolderStatuses,
      })
    },
    onError: () => {
      toast.error('Failed to add NAS device')
    },
  })

  return {
    addNas: mutateAsync,
    ...rest,
  }
}
