import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { NasDevice } from '@synology-shared-folder-unlocker/config'
import { toast } from '@synology-shared-folder-unlocker/theme'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useUpdateNas() {
  const queryClient = useQueryClient()

  const { mutateAsync, ...rest } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NasDevice> }) =>
      apiClient.updateNas(id, data),
    onSuccess: () => {
      toast.success('NAS device updated')
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
    },
    onError: () => {
      toast.error('Failed to update NAS device')
    },
  })

  return {
    updateNas: mutateAsync,
    ...rest,
  }
}
