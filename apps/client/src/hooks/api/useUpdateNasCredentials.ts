import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UpdateNasCredentials } from '../../types/apiClient'
import { toast } from '@synology-shared-folder-unlocker/theme'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useUpdateNasCredentials() {
  const queryClient = useQueryClient()

  const { mutateAsync, ...rest } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNasCredentials }) =>
      apiClient.updateNasCredentials(id, data),
    onSuccess: () => {
      toast.success('Credentials updated')
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
    },
    onError: () => {
      toast.error('Failed to update credentials')
    },
  })

  return {
    updateNasCredentials: mutateAsync,
    ...rest,
  }
}
