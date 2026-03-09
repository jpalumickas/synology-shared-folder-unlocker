import type { EncryptedShareFolder } from '@synology-shared-folder-unlocker/config'
import type { ShareFolderStatus } from '@synology-shared-folder-unlocker/unlocker'
import type {
  AddNasParams,
  AppStatus,
  NasDeviceInfo,
  UpdateNasCredentials,
} from '../types/apiClient'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data as T
}

export const apiClient = {
  getStatus: () => request<AppStatus>('/status'),

  init: (password: string) =>
    request<{ success: boolean }>('/init', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  unlock: (password: string) =>
    request<{ success: boolean }>('/unlock', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  logout: () => request<{ success: boolean }>('/logout', { method: 'POST' }),

  getNasList: () => request<NasDeviceInfo[]>('/nas'),

  addNas: (data: AddNasParams) =>
    request<NasDeviceInfo>('/nas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateNas: (id: string, data: Partial<NasDeviceInfo>) =>
    request<NasDeviceInfo>(`/nas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateNasCredentials: (id: string, data: UpdateNasCredentials) =>
    request<NasDeviceInfo>(`/nas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteNas: (id: string) =>
    request<{ success: boolean }>(`/nas/${id}`, { method: 'DELETE' }),

  addShareFolder: (nasId: string, data: Omit<EncryptedShareFolder, 'id'>) =>
    request<EncryptedShareFolder>(`/nas/${nasId}/share-folders`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateShareFolder: (
    nasId: string,
    shareFolderId: string,
    data: Partial<EncryptedShareFolder>
  ) =>
    request<EncryptedShareFolder>(
      `/nas/${nasId}/share-folders/${shareFolderId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  deleteShareFolder: (nasId: string, shareFolderId: string) =>
    request<{ success: boolean }>(
      `/nas/${nasId}/share-folders/${shareFolderId}`,
      {
        method: 'DELETE',
      }
    ),

  unlockShareFolder: (nasId: string, shareFolderId: string) =>
    request<{ success: boolean; message: string }>(
      `/nas/${nasId}/share-folders/${shareFolderId}/unlock`,
      { method: 'POST' }
    ),

  getShareFolderStatuses: () =>
    request<ShareFolderStatus[]>('/share-folders/status'),

  pollNow: () =>
    request<{ success: boolean; statuses: ShareFolderStatus[] }>(
      '/share-folders/poll',
      {
        method: 'POST',
      }
    ),

  getSettings: () => request<{ pollingInterval: number }>('/settings'),

  updateSettings: (data: { pollingInterval: number }) =>
    request<{ pollingInterval: number }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>('/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
}
