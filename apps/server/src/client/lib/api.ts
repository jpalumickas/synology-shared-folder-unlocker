import type {
  NasDevice,
  EncryptedShare,
  ShareStatus,
  AppStatus,
} from '@synology-unlocker/config';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}

export const api = {
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

  lock: () => request<{ success: boolean }>('/lock', { method: 'POST' }),

  getNasList: () => request<NasDevice[]>('/nas'),

  addNas: (data: Omit<NasDevice, 'id' | 'shares'>) =>
    request<NasDevice>('/nas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateNas: (id: string, data: Partial<NasDevice>) =>
    request<NasDevice>(`/nas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteNas: (id: string) =>
    request<{ success: boolean }>(`/nas/${id}`, { method: 'DELETE' }),

  addShare: (nasId: string, data: Omit<EncryptedShare, 'id'>) =>
    request<EncryptedShare>(`/nas/${nasId}/shares`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateShare: (
    nasId: string,
    shareId: string,
    data: Partial<EncryptedShare>,
  ) =>
    request<EncryptedShare>(`/nas/${nasId}/shares/${shareId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteShare: (nasId: string, shareId: string) =>
    request<{ success: boolean }>(`/nas/${nasId}/shares/${shareId}`, {
      method: 'DELETE',
    }),

  unlockShare: (nasId: string, shareId: string) =>
    request<{ success: boolean; message: string }>(
      `/nas/${nasId}/shares/${shareId}/unlock`,
      { method: 'POST' },
    ),

  getShareStatuses: () => request<ShareStatus[]>('/shares/status'),

  pollNow: () =>
    request<{ success: boolean; statuses: ShareStatus[] }>('/shares/poll', {
      method: 'POST',
    }),

  getSettings: () => request<{ pollingInterval: number }>('/settings'),

  updateSettings: (data: { pollingInterval: number }) =>
    request<{ pollingInterval: number }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
