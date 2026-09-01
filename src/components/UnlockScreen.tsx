import { useState, type FormEvent } from 'react'
import { useVault } from '../context/VaultContext'
import {
  Alert,
  Button,
  Card,
  IconShield,
  PasswordInput,
} from './ui'

export function UnlockScreen() {
  const { isInitialized, setupVault, unlock, doImport, loading, error, clearError } =
    useVault()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const isSetup = isInitialized === false

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!password.trim()) {
      setLocalError('Please enter a password')
      return
    }

    if (isSetup) {
      if (password.length < 8) {
        setLocalError('Master password must be at least 8 characters')
        return
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match')
        return
      }
      await setupVault(password)
    } else {
      await unlock(password)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    clearError()
    await doImport(file, true)
    e.target.value = ''
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-vault-950 via-vault-900 to-vault-950" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vault-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-vault-accent/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vault-500/20 text-vault-400 mb-4">
            <IconShield />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Vault</h1>
          <p className="text-slate-400 text-sm">
            {isSetup
              ? 'Create your master password to secure your data'
              : 'Enter your master password to unlock'}
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {displayError && (
              <Alert message={displayError} onDismiss={() => { setLocalError(null); clearError() }} />
            )}

            <PasswordInput
              label="Master Password"
              hint="This password protects your vault. It cannot be recovered if lost."
              value={password}
              onChange={setPassword}
              placeholder="Enter master password"
              autoFocus
            />

            {isSetup && (
              <PasswordInput
                label="Confirm Master Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm master password"
              />
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Please wait...' : isSetup ? 'Create Vault' : 'Unlock Vault'}
            </Button>
          </form>

          {isSetup && (
            <div className="mt-6 pt-6 border-t border-vault-700/50">
              <p className="text-xs text-slate-500 text-center mb-3">
                Or restore from a backup file
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <span className="flex items-center justify-center gap-2 w-full cursor-pointer rounded-xl border border-dashed border-vault-600 hover:border-vault-500 px-4 py-3 text-sm text-slate-400 hover:text-slate-300 transition-colors">
                  Import backup file
                </span>
              </label>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-slate-600 mt-6">
          All encryption happens locally in your browser. Your data never leaves your device.
        </p>
      </div>
    </div>
  )
}
