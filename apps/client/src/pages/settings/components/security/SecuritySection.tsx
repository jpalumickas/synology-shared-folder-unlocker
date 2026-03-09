import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@synology-shared-folder-unlocker/theme'
import { Shield } from 'lucide-react'
import { ChangePasswordForm } from './ChangePasswordForm'

export function SecuritySection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Security</CardTitle>
            <CardDescription>
              Change the master password used to encrypt your configuration.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm />
      </CardContent>
    </Card>
  )
}
