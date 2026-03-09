import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function usePollNow() {
  const queryClient = useQueryClient()

  const { mutate, ...rest } = useMutation({
    mutationFn: () => apiClient.pollNow(),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.shareFolderStatuses, result.statuses)
    },
  })

  return {
    pollNow: mutate,
    ...rest,
  }
}
