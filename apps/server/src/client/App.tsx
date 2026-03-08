import { useState, useEffect } from 'react'
import { api } from './lib/api'
import { InitPage } from './pages/InitPage'
import { UnlockPage } from './pages/UnlockPage'
import { DashboardPage } from './pages/DashboardPage'

type AppView = 'loading' | 'init' | 'unlock' | 'dashboard'

export function App() {
  const [view, setView] = useState<AppView>('loading')

  useEffect(() => {
    api
      .getStatus()
      .then((status) => {
        if (!status.initialized) setView('init')
        else if (!status.unlocked || !status.sessionValid) setView('unlock')
        else setView('dashboard')
      })
      .catch(() => setView('init'))
  }, [])

  switch (view) {
    case 'loading':
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    case 'init':
      return <InitPage onComplete={() => setView('dashboard')} />
    case 'unlock':
      return <UnlockPage onComplete={() => setView('dashboard')} />
    case 'dashboard':
      return <DashboardPage onLock={() => setView('unlock')} />
  }
}
