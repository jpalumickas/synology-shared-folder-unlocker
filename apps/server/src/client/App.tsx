import { useState, useEffect } from 'react';
import { api } from './lib/api';
import { InitPage } from './pages/InitPage';
import { UnlockPage } from './pages/UnlockPage';
import { DashboardPage } from './pages/DashboardPage';

type AppView = 'loading' | 'init' | 'unlock' | 'dashboard';

export function App() {
  const [view, setView] = useState<AppView>('loading');

  useEffect(() => {
    api.getStatus().then((status) => {
      if (!status.initialized) setView('init');
      else if (!status.unlocked || !status.sessionValid) setView('unlock');
      else setView('dashboard');
    }).catch(() => setView('init'));
  }, []);

  switch (view) {
    case 'loading':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Loading...</p>
        </div>
      );
    case 'init':
      return <InitPage onComplete={() => setView('dashboard')} />;
    case 'unlock':
      return <UnlockPage onComplete={() => setView('dashboard')} />;
    case 'dashboard':
      return <DashboardPage onLock={() => setView('unlock')} />;
  }
}
