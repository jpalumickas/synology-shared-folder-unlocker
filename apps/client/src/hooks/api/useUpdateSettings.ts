import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { pollingInterval: number }) =>
      apiClient.updateSettings(data),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.settings, result)
    },
  })
}
