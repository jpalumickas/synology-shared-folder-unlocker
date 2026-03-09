import { useMutation } from '@tanstack/react-query'
import { toast } from '@synology-shared-folder-unlocker/theme'
import { apiClient } from '../../services/apiClient'

export function useChangePassword() {
  const { mutateAsync, ...rest } = useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string
      newPassword: string
    }) => apiClient.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed')
    },
    onError: () => {
      toast.error('Failed to change password')
    },
  })

  return {
    changePassword: mutateAsync,
    ...rest,
  }
}
