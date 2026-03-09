import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AddNasParams } from '../../types/apiClient'
import { toast } from '@synology-shared-folder-unlocker/theme'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useAddNas() {
  const queryClient = useQueryClient()

  const { mutateAsync, ...rest } = useMutation({
    mutationFn: (data: AddNasParams) => apiClient.addNas(data),
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
