import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router'
import { api } from './lib/api'
import { DashboardPage } from './pages/DashboardPage'
import { InitPage } from './pages/InitPage'
import { UnlockPage } from './pages/UnlockPage'
import { SettingsPage } from './pages/SettingsPage'

const rootRoute = createRootRoute({
  beforeLoad: async () => {
    const status = await api.getStatus()
    return { status }
  },
  component: Outlet,
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context }) => {
    if (!context.status.initialized) throw redirect({ to: '/init' })
    if (!context.status.unlocked || !context.status.sessionValid)
      throw redirect({ to: '/unlock' })
  },
  component: DashboardPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: ({ context }) => {
    if (!context.status.initialized) throw redirect({ to: '/init' })
    if (!context.status.unlocked || !context.status.sessionValid)
      throw redirect({ to: '/unlock' })
  },
  component: SettingsPage,
})

const initRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/init',
  beforeLoad: ({ context }) => {
    if (
      context.status.initialized &&
      context.status.unlocked &&
      context.status.sessionValid
    ) {
      throw redirect({ to: '/' })
    }
  },
  component: InitPage,
})

const unlockRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/unlock',
  beforeLoad: ({ context }) => {
    if (!context.status.initialized) throw redirect({ to: '/init' })
    if (context.status.unlocked && context.status.sessionValid)
      throw redirect({ to: '/' })
  },
  component: UnlockPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  settingsRoute,
  initRoute,
  unlockRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
