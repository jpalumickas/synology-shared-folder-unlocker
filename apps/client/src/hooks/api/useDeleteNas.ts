import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useDeleteNas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteNas(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareFolderStatuses,
      })
    },
  })
}
