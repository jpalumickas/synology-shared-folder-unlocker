import { Navbar } from '../../components/Navbar'
import { PollingSection } from './components/polling/PollingSection'
import { SecuritySection } from './components/security/SecuritySection'

export function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PollingSection />
        <SecuritySection />
      </main>
    </div>
  )
}
