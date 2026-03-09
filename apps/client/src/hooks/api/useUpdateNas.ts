import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { NasDevice } from '@synology-shared-folder-unlocker/config'
import { apiClient } from '../../services/apiClient'
import { queryKeys } from './queryKeys'

export function useUpdateNas() {
  const queryClient = useQueryClient()

  const { mutateAsync, ...rest } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NasDevice> }) =>
      apiClient.updateNas(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nasList })
    },
  })

  return {
    updateNas: mutateAsync,
    ...rest,
  }
}
