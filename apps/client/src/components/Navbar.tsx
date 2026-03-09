import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@synology-shared-folder-unlocker/theme'
import { type ReactNode } from 'react'
import { LogOut, Server, Settings } from 'lucide-react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { apiClient } from '../services/apiClient'

export function Navbar({ children }: { children?: ReactNode }) {
  const router = useRouter()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await apiClient.logout()
    await router.invalidate()
    await navigate({ to: '/' })
  }

  return (
    <header className="border-b bg-card">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Server className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-lg font-semibold truncate hidden sm:block">
            Synology Shared Drives Unlocker
          </h1>
        </Link>

        <div className="flex items-center gap-1.5">
          {children}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => navigate({ to: '/settings' })}
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleLogout}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Logout</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
