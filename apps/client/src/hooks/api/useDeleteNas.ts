import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@synology-shared-folder-unlocker/theme'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useDeleteNas() {
  const queryClient = useQueryClient()

  const { mutateAsync, ...rest } = useMutation({
    mutationFn: (id: string) => apiClient.deleteNas(id),
    onSuccess: () => {
      toast.success('NAS device deleted')
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareFolderStatuses,
      })
    },
    onError: () => {
      toast.error('Failed to delete NAS device')
    },
  })

  return {
    deleteNas: mutateAsync,
    ...rest,
  }
}
