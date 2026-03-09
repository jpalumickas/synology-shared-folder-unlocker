import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@synology-shared-folder-unlocker/theme'
import { Shield } from 'lucide-react'
import { InitForm } from './components/InitForm'

export function InitPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Synology Shared Drives Unlocker</CardTitle>
              <CardDescription>
                Set a master password to encrypt your configuration.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <InitForm />
        </CardContent>
      </Card>
    </div>
  )
}
