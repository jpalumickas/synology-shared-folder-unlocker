import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@synology-shared-folder-unlocker/theme'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function usePollNow() {
  const queryClient = useQueryClient()

  const { mutate, ...rest } = useMutation({
    mutationFn: () => apiClient.pollNow(),
    onSuccess: (result) => {
      toast.success('Status check complete')
      queryClient.setQueryData(queryKeys.shareFolderStatuses, result.statuses)
    },
    onError: () => {
      toast.error('Failed to check status')
    },
  })

  return {
    pollNow: mutate,
    ...rest,
  }
}
