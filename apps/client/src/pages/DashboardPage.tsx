import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Separator,
  cn,
} from '@synology-shared-folder-unlocker/theme'
import {
  FolderLock,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Server,
  Settings,
  Trash2,
  Unlock,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAppForm, getFieldError } from '../hooks/form/useForm'
import { FormWrapper } from '../components/FormWrapper'
import type {
  NasDevice,
  ShareFolderStatus,
} from '@synology-shared-folder-unlocker/config'

// --- Status Badge ---

function StatusBadge({ status }: { status: ShareFolderStatus['status'] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 capitalize',
        status === 'unlocked' &&
          'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400',
        status === 'locked' &&
          'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400',
        status === 'error' &&
          'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'unlocked' && 'bg-green-500',
          status === 'locked' && 'bg-red-500',
          status === 'error' && 'bg-amber-500',
          status === 'unknown' && 'bg-muted-foreground'
        )}
      />
      {status}
    </Badge>
  )
}

// --- NAS Form ---

function NasForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: NasDevice
  onSubmit: (data: Omit<NasDevice, 'id' | 'shareFolders'>) => Promise<void>
  onCancel: () => void
}) {
  const [submitError, setSubmitError] = useState('')

  const form = useAppForm({
    defaultValues: {
      name: initial?.name ?? '',
      host: initial?.host ?? '',
      port: initial?.port ?? 22,
      username: initial?.username ?? '',
      password: initial?.password ?? '',
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, 'Name is required'),
        host: z.string().min(1, 'Host is required'),
        port: z.number().min(1, 'Invalid port').max(65535, 'Invalid port'),
        username: z.string().min(1, 'Username is required'),
        password: initial
          ? z.string()
          : z.string().min(1, 'Password is required'),
      }),
    },
    onSubmit: async ({ value }) => {
      setSubmitError('')
      try {
        await onSubmit(value)
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed')
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      autoComplete="off"
      className="space-y-4"
    >
      <form.Field name="name">
        {(field) => (
          <FormWrapper label="Name" error={getFieldError(field)}>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="My NAS"
            />
          </FormWrapper>
        )}
      </form.Field>

      <form.Field name="host">
        {(field) => (
          <FormWrapper label="Host" error={getFieldError(field)}>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="192.168.1.100"
            />
          </FormWrapper>
        )}
      </form.Field>

      <form.Field name="port">
        {(field) => (
          <FormWrapper label="SSH Port" error={getFieldError(field)}>
            <Input
              type="number"
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
              onBlur={field.handleBlur}
            />
          </FormWrapper>
        )}
      </form.Field>

      <form.Field name="username">
        {(field) => (
          <FormWrapper label="Username" error={getFieldError(field)}>
            <Input
              autoComplete="off"
              data-1p-ignore
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="admin"
            />
          </FormWrapper>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <FormWrapper label="SSH Password" error={getFieldError(field)}>
            <Input
              type="password"
              autoComplete="off"
              data-1p-ignore
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </FormWrapper>
        )}
      </form.Field>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}

// --- Share Folder Form ---

function ShareFolderForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: { name: string; password: string }
  onSubmit: (data: { name: string; password: string }) => Promise<void>
  onCancel: () => void
}) {
  const [submitError, setSubmitError] = useState('')

  const form = useAppForm({
    defaultValues: {
      name: initial?.name ?? '',
      password: initial?.password ?? '',
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, 'Name is required'),
        password: initial
          ? z.string()
          : z.string().min(1, 'Password is required'),
      }),
    },
    onSubmit: async ({ value }) => {
      setSubmitError('')
      try {
        await onSubmit(value)
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed')
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      autoComplete="off"
      className="space-y-4"
    >
      <form.Field name="name">
        {(field) => (
          <FormWrapper
            label="Share Folder Name"
            error={getFieldError(field)}
            description="The encrypted shared folder name on the Synology NAS"
          >
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="photos"
            />
          </FormWrapper>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <FormWrapper label="Encryption Password" error={getFieldError(field)}>
            <Input
              type="password"
              autoComplete="off"
              data-1p-ignore
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </FormWrapper>
        )}
      </form.Field>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}

// --- Dashboard Page ---

export function DashboardPage({
  onLogout,
  onSettings,
}: {
  onLogout: () => void
  onSettings: () => void
}) {
  const [nasList, setNasList] = useState<NasDevice[]>([])
  const [statuses, setStatuses] = useState<ShareFolderStatus[]>([])
  const [pollingInterval, setPollingInterval] = useState(120)
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [showAddNas, setShowAddNas] = useState(false)
  const [editingNas, setEditingNas] = useState<NasDevice | null>(null)
  const [addShareFolderNasId, setAddShareFolderNasId] = useState<string | null>(
    null
  )
  const [editingShareFolder, setEditingShareFolder] = useState<{
    nasId: string
    shareFolder: { id: string; name: string; password: string }
  } | null>(null)
  const [polling, setPolling] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [nas, sts, settings] = await Promise.all([
        api.getNasList(),
        api.getShareFolderStatuses(),
        api.getSettings(),
      ])
      setNasList(nas)
      setStatuses(sts)
      setPollingInterval(settings.pollingInterval)
    } catch {
      // Session may have expired
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh statuses every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const sts = await api.getShareFolderStatuses()
        setStatuses(sts)
      } catch {
        /* ignore */
      }
    }, 10_000)
    return () => clearInterval(interval)
  }, [])

  const getShareFolderStatus = (nasId: string, shareFolderId: string) =>
    statuses.find((s) => s.nasId === nasId && s.shareFolderId === shareFolderId)

  const handleLogout = async () => {
    await api.logout()
    onLogout()
  }

  const handlePollNow = async () => {
    setPolling(true)
    try {
      const result = await api.pollNow()
      setStatuses(result.statuses)
    } catch {
      /* ignore */
    } finally {
      setPolling(false)
    }
  }

  const handleAddNas = async (data: Omit<NasDevice, 'id' | 'shareFolders'>) => {
    await api.addNas(data)
    setShowAddNas(false)
    fetchData()
  }

  const handleUpdateNas = async (
    data: Omit<NasDevice, 'id' | 'shareFolders'>
  ) => {
    if (!editingNas) return
    await api.updateNas(editingNas.id, data)
    setEditingNas(null)
    fetchData()
  }

  const handleDeleteNas = async (id: string) => {
    if (!confirm('Delete this NAS device and all its share folders?')) return
    await api.deleteNas(id)
    fetchData()
  }

  const handleAddShareFolder = async (data: {
    name: string
    password: string
  }) => {
    if (!addShareFolderNasId) return
    await api.addShareFolder(addShareFolderNasId, data)
    setAddShareFolderNasId(null)
    fetchData()
  }

  const handleUpdateShareFolder = async (data: {
    name: string
    password: string
  }) => {
    if (!editingShareFolder) return
    await api.updateShareFolder(
      editingShareFolder.nasId,
      editingShareFolder.shareFolder.id,
      data
    )
    setEditingShareFolder(null)
    fetchData()
  }

  const handleDeleteShareFolder = async (
    nasId: string,
    shareFolderId: string
  ) => {
    if (!confirm('Delete this share folder?')) return
    await api.deleteShareFolder(nasId, shareFolderId)
    fetchData()
  }

  const handleUnlockShareFolder = async (
    nasId: string,
    shareFolderId: string
  ) => {
    try {
      await api.unlockShareFolder(nasId, shareFolderId)
      const sts = await api.getShareFolderStatuses()
      setStatuses(sts)
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Server className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold">
              Synology Shared Drives Unlocker
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePollNow}
              disabled={polling}
            >
              <RefreshCw className={cn('h-4 w-4', polling && 'animate-spin')} />
              {polling ? 'Checking...' : 'Check Now'}
            </Button>
            <Button variant="outline" size="sm" onClick={onSettings}>
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">NAS Devices</h2>
          <Button size="sm" onClick={() => setShowAddNas(true)}>
            <Plus className="h-4 w-4" />
            Add NAS
          </Button>
        </div>

        {nasList.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
                <Server className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No NAS devices configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a NAS device to get started.
              </p>
              <Button onClick={() => setShowAddNas(true)}>
                <Plus className="h-4 w-4" />
                Add NAS Device
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {nasList.map((nas) => (
              <Card key={nas.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Server className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{nas.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {nas.username}@{nas.host}:{nas.port}
                      </p>
                    </div>
                  </div>
                  <CardAction>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddShareFolderNasId(nas.id)}
                      >
                        <FolderLock className="h-3.5 w-3.5" />
                        Add Folder
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingNas(nas)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteNas(nas.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardAction>
                </CardHeader>

                {nas.shareFolders.length > 0 && <Separator />}

                <CardContent
                  className={cn(nas.shareFolders.length === 0 && 'py-0 pb-2')}
                >
                  {nas.shareFolders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No encrypted share folders configured.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {nas.shareFolders.map((shareFolder, index) => {
                        const st = getShareFolderStatus(nas.id, shareFolder.id)
                        return (
                          <div key={shareFolder.id}>
                            {index > 0 && <Separator className="my-1" />}
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <StatusBadge status={st?.status ?? 'unknown'} />
                                <span className="font-mono text-sm truncate">
                                  {shareFolder.name}
                                </span>
                                {st?.error && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400 truncate">
                                    {st.error}
                                  </span>
                                )}
                                {st?.lastChecked && (
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {new Date(
                                      st.lastChecked
                                    ).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0 ml-2">
                                {st?.status !== 'unlocked' && (
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() =>
                                      handleUnlockShareFolder(
                                        nas.id,
                                        shareFolder.id
                                      )
                                    }
                                    className="text-green-700 hover:text-green-800 dark:text-green-400"
                                  >
                                    <Unlock className="h-3.5 w-3.5" />
                                    Unlock
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() =>
                                    setEditingShareFolder({
                                      nasId: nas.id,
                                      shareFolder,
                                    })
                                  }
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() =>
                                    handleDeleteShareFolder(
                                      nas.id,
                                      shareFolder.id
                                    )
                                  }
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-6 text-center">
          Polling every {pollingInterval}s. Share folders are checked and
          automatically unlocked in the background.
        </p>
      </main>

      {/* Dialogs */}
      <Dialog open={showAddNas} onOpenChange={setShowAddNas}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add NAS Device</DialogTitle>
          </DialogHeader>
          <NasForm
            onSubmit={handleAddNas}
            onCancel={() => setShowAddNas(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingNas}
        onOpenChange={(open) => !open && setEditingNas(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit NAS Device</DialogTitle>
          </DialogHeader>
          {editingNas && (
            <NasForm
              initial={editingNas}
              onSubmit={handleUpdateNas}
              onCancel={() => setEditingNas(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!addShareFolderNasId}
        onOpenChange={(open) => !open && setAddShareFolderNasId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Encrypted Share Folder</DialogTitle>
          </DialogHeader>
          <ShareFolderForm
            onSubmit={handleAddShareFolder}
            onCancel={() => setAddShareFolderNasId(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingShareFolder}
        onOpenChange={(open) => !open && setEditingShareFolder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Share Folder</DialogTitle>
          </DialogHeader>
          {editingShareFolder && (
            <ShareFolderForm
              initial={editingShareFolder.shareFolder}
              onSubmit={handleUpdateShareFolder}
              onCancel={() => setEditingShareFolder(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
