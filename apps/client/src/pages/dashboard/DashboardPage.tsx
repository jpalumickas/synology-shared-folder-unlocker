import { Navbar } from '../../components/Navbar'
import { useDashboardDialogs } from './hooks/useDashboardDialogs'
import { PollNowButton } from './components/PollNowButton'
import { PollingStatus } from './components/PollingStatus'
import { NasList } from './components/list/NasList'
import { AddNasDialog } from './components/nas/AddNasDialog'
import { EditNasDialog } from './components/nas/EditNasDialog'
import { AddShareFolderDialog } from './components/share-folder/AddShareFolderDialog'
import { EditShareFolderDialog } from './components/share-folder/EditShareFolderDialog'

export function DashboardPage() {
  const {
    showAddNas,
    setShowAddNas,
    editingNas,
    setEditingNas,
    addShareFolderNasId,
    setAddShareFolderNasId,
    editingShareFolder,
    setEditingShareFolder,
  } = useDashboardDialogs()

  return (
    <div className="min-h-screen bg-background">
      <Navbar>
        <PollNowButton />
      </Navbar>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <NasList
          onAddNas={() => setShowAddNas(true)}
          onEditNas={setEditingNas}
          onAddShareFolder={setAddShareFolderNasId}
          onEditShareFolder={setEditingShareFolder}
        />

        <PollingStatus />
      </main>

      <AddNasDialog open={showAddNas} onOpenChange={setShowAddNas} />
      <EditNasDialog nas={editingNas} onClose={() => setEditingNas(null)} />
      <AddShareFolderDialog
        nasId={addShareFolderNasId}
        onClose={() => setAddShareFolderNasId(null)}
      />
      <EditShareFolderDialog
        editing={editingShareFolder}
        onClose={() => setEditingShareFolder(null)}
      />
    </div>
  )
}
