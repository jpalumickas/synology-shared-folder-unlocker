import { Navbar } from '../../components/Navbar'
import { PollNowButton } from './components/PollNowButton'
import { PollingStatus } from './components/PollingStatus'
import { NasList } from './components/list/NasList'
import { AddNasDialog } from './components/nas/AddNasDialog'
import { EditNasDialog } from './components/nas/EditNasDialog'
import { UpdateCredentialsDialog } from './components/nas/UpdateCredentialsDialog'
import { AddShareFolderDialog } from './components/share-folder/AddShareFolderDialog'
import { EditShareFolderDialog } from './components/share-folder/EditShareFolderDialog'

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar>
        <PollNowButton />
      </Navbar>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <NasList />

        <PollingStatus />
      </main>

      <AddNasDialog />
      <EditNasDialog />
      <UpdateCredentialsDialog />
      <AddShareFolderDialog />
      <EditShareFolderDialog />
    </div>
  )
}
