import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@synology-shared-folder-unlocker/theme'
import { LockKeyhole } from 'lucide-react'
import { UnlockForm } from './components/UnlockForm'

export function UnlockPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <LockKeyhole className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Synology Shared Drives Unlocker</CardTitle>
              <CardDescription>
                Enter your master password to unlock.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UnlockForm />
        </CardContent>
      </Card>
    </div>
  )
}
