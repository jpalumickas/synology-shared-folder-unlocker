import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  const { mutateAsync, ...rest } = useMutation({
    mutationFn: (data: { pollingInterval: number }) =>
      apiClient.updateSettings(data),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.settings, result)
    },
  })

  return {
    updateSettings: mutateAsync,
    ...rest,
  }
}
