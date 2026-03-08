import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { NasDevice, ShareFolderStatus } from '@synology-unlocker/config';

// --- Modal ---

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// --- Status Badge ---

function StatusBadge({ status }: { status: ShareFolderStatus['status'] }) {
  const colors = {
    unknown: 'bg-gray-400',
    locked: 'bg-red-500',
    unlocked: 'bg-green-500',
    error: 'bg-amber-500',
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`w-2.5 h-2.5 rounded-full ${colors[status]}`} />
      {status}
    </span>
  );
}

// --- NAS Form ---

function NasForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: NasDevice;
  onSubmit: (data: Omit<NasDevice, 'id' | 'shareFolders'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [host, setHost] = useState(initial?.host ?? '');
  const [port, setPort] = useState(initial?.port ?? 22);
  const [username, setUsername] = useState(initial?.username ?? '');
  const [password, setPassword] = useState(initial?.password ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit({ name, host, port, username, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="My NAS"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Host
        </label>
        <input
          value={host}
          onChange={(e) => setHost(e.target.value)}
          className={inputClass}
          placeholder="192.168.1.100"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SSH Port
        </label>
        <input
          type="number"
          value={port}
          onChange={(e) => setPort(Number(e.target.value))}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
          placeholder="admin"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SSH Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required={!initial}
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

// --- Share Folder Form ---

function ShareFolderForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: { name: string; password: string };
  onSubmit: (data: { name: string; password: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [password, setPassword] = useState(initial?.password ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit({ name, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Share Folder Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="photos"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          The encrypted shared folder name on the Synology NAS
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Encryption Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required={!initial}
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

// --- Dashboard Page ---

export function DashboardPage({ onLock }: { onLock: () => void }) {
  const [nasList, setNasList] = useState<NasDevice[]>([]);
  const [statuses, setStatuses] = useState<ShareFolderStatus[]>([]);
  const [pollingInterval, setPollingInterval] = useState(120);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddNas, setShowAddNas] = useState(false);
  const [editingNas, setEditingNas] = useState<NasDevice | null>(null);
  const [addShareFolderNasId, setAddShareFolderNasId] = useState<string | null>(null);
  const [editingShareFolder, setEditingShareFolder] = useState<{
    nasId: string;
    shareFolder: { id: string; name: string; password: string };
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [polling, setPolling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [nas, sts, settings] = await Promise.all([
        api.getNasList(),
        api.getShareFolderStatuses(),
        api.getSettings(),
      ]);
      setNasList(nas);
      setStatuses(sts);
      setPollingInterval(settings.pollingInterval);
    } catch {
      // Session may have expired
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh statuses every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const sts = await api.getShareFolderStatuses();
        setStatuses(sts);
      } catch {
        /* ignore */
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const getShareFolderStatus = (nasId: string, shareFolderId: string) =>
    statuses.find((s) => s.nasId === nasId && s.shareFolderId === shareFolderId);

  const handleLock = async () => {
    await api.lock();
    onLock();
  };

  const handlePollNow = async () => {
    setPolling(true);
    try {
      const result = await api.pollNow();
      setStatuses(result.statuses);
    } catch {
      /* ignore */
    } finally {
      setPolling(false);
    }
  };

  const handleAddNas = async (
    data: Omit<NasDevice, 'id' | 'shareFolders'>,
  ) => {
    await api.addNas(data);
    setShowAddNas(false);
    fetchData();
  };

  const handleUpdateNas = async (data: Omit<NasDevice, 'id' | 'shareFolders'>) => {
    if (!editingNas) return;
    await api.updateNas(editingNas.id, data);
    setEditingNas(null);
    fetchData();
  };

  const handleDeleteNas = async (id: string) => {
    if (!confirm('Delete this NAS device and all its share folders?')) return;
    await api.deleteNas(id);
    fetchData();
  };

  const handleAddShareFolder = async (data: { name: string; password: string }) => {
    if (!addShareFolderNasId) return;
    await api.addShareFolder(addShareFolderNasId, data);
    setAddShareFolderNasId(null);
    fetchData();
  };

  const handleUpdateShareFolder = async (data: {
    name: string;
    password: string;
  }) => {
    if (!editingShareFolder) return;
    await api.updateShareFolder(editingShareFolder.nasId, editingShareFolder.shareFolder.id, data);
    setEditingShareFolder(null);
    fetchData();
  };

  const handleDeleteShareFolder = async (nasId: string, shareFolderId: string) => {
    if (!confirm('Delete this share folder?')) return;
    await api.deleteShareFolder(nasId, shareFolderId);
    fetchData();
  };

  const handleUnlockShareFolder = async (nasId: string, shareFolderId: string) => {
    try {
      await api.unlockShareFolder(nasId, shareFolderId);
      const sts = await api.getShareFolderStatuses();
      setStatuses(sts);
    } catch {
      /* ignore */
    }
  };

  const handleSaveSettings = async (interval: number) => {
    await api.updateSettings({ pollingInterval: interval });
    setPollingInterval(interval);
    setShowSettings(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Synology Shared Drives Unlocker
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handlePollNow}
              disabled={polling}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 cursor-pointer"
            >
              {polling ? 'Checking...' : 'Check Now'}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              Settings
            </button>
            <button
              onClick={handleLock}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">NAS Devices</h2>
          <button
            onClick={() => setShowAddNas(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm cursor-pointer"
          >
            + Add NAS
          </button>
        </div>

        {nasList.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
            No NAS devices configured. Add one to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {nasList.map((nas) => (
              <div
                key={nas.id}
                className="bg-white rounded-lg shadow-sm border"
              >
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{nas.name}</h3>
                    <p className="text-sm text-gray-500">
                      {nas.username}@{nas.host}:{nas.port}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddShareFolderNasId(nas.id)}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 cursor-pointer"
                    >
                      + Share Folder
                    </button>
                    <button
                      onClick={() => setEditingNas(nas)}
                      className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteNas(nas.id)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {nas.shareFolders.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    No encrypted share folders configured.
                  </div>
                ) : (
                  <div className="divide-y">
                    {nas.shareFolders.map((shareFolder) => {
                      const st = getShareFolderStatus(nas.id, shareFolder.id);
                      return (
                        <div
                          key={shareFolder.id}
                          className="px-4 py-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <StatusBadge status={st?.status ?? 'unknown'} />
                            <span className="font-mono text-sm">
                              {shareFolder.name}
                            </span>
                            {st?.error && (
                              <span className="text-xs text-amber-600">
                                {st.error}
                              </span>
                            )}
                            {st?.lastChecked && (
                              <span className="text-xs text-gray-400">
                                checked{' '}
                                {new Date(st.lastChecked).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {st?.status !== 'unlocked' && (
                              <button
                                onClick={() =>
                                  handleUnlockShareFolder(nas.id, shareFolder.id)
                                }
                                className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 cursor-pointer"
                              >
                                Unlock
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setEditingShareFolder({ nasId: nas.id, shareFolder })
                              }
                              className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteShareFolder(nas.id, shareFolder.id)
                              }
                              className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6 text-center">
          Polling every {pollingInterval}s. Share folders are checked and automatically
          unlocked in the background.
        </p>
      </main>

      {/* Modals */}
      <Modal
        open={showAddNas}
        onClose={() => setShowAddNas(false)}
        title="Add NAS Device"
      >
        <NasForm
          onSubmit={handleAddNas}
          onCancel={() => setShowAddNas(false)}
        />
      </Modal>

      <Modal
        open={!!editingNas}
        onClose={() => setEditingNas(null)}
        title="Edit NAS Device"
      >
        {editingNas && (
          <NasForm
            initial={editingNas}
            onSubmit={handleUpdateNas}
            onCancel={() => setEditingNas(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!addShareFolderNasId}
        onClose={() => setAddShareFolderNasId(null)}
        title="Add Encrypted Share Folder"
      >
        <ShareFolderForm
          onSubmit={handleAddShareFolder}
          onCancel={() => setAddShareFolderNasId(null)}
        />
      </Modal>

      <Modal
        open={!!editingShareFolder}
        onClose={() => setEditingShareFolder(null)}
        title="Edit Share Folder"
      >
        {editingShareFolder && (
          <ShareFolderForm
            initial={editingShareFolder.shareFolder}
            onSubmit={handleUpdateShareFolder}
            onCancel={() => setEditingShareFolder(null)}
          />
        )}
      </Modal>

      <Modal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="Settings"
      >
        <SettingsForm
          initialInterval={pollingInterval}
          onSubmit={handleSaveSettings}
          onCancel={() => setShowSettings(false)}
        />
      </Modal>
    </div>
  );
}

// --- Settings Form ---

function SettingsForm({
  initialInterval,
  onSubmit,
  onCancel,
}: {
  initialInterval: number;
  onSubmit: (interval: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [interval, setInterval] = useState(initialInterval);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(interval);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Polling Interval (seconds)
        </label>
        <input
          type="number"
          min={10}
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          How often to check and auto-unlock share folders (minimum 10s)
        </p>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
