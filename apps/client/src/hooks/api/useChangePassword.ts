import { useMutation } from '@tanstack/react-query'
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
  })

  return {
    changePassword: mutateAsync,
    ...rest,
  }
}
