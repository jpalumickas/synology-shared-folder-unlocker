import { useState } from 'react'
import { api } from '../lib/api'

export function UnlockPage({ onComplete }: { onComplete: () => void }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string

    try {
      await api.unlock(password)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">
          Synology Shared Drives Unlocker
        </h1>
        <p className="text-gray-600 mb-6">
          Enter your master password to unlock.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Master Password
            </label>
            <input
              name="password"
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  )
}
