import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@synology-shared-folder-unlocker/theme'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  const { mutateAsync, ...rest } = useMutation({
    mutationFn: (data: { pollingInterval: number }) =>
      apiClient.updateSettings(data),
    onSuccess: (result) => {
      toast.success('Settings saved')
      queryClient.setQueryData(queryKeys.settings, result)
    },
    onError: () => {
      toast.error('Failed to save settings')
    },
  })

  return {
    updateSettings: mutateAsync,
    ...rest,
  }
}
