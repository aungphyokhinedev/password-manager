import { useState, type FormEvent } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useVault } from '../context/VaultContext'
import { useVaultError } from '../hooks/useVaultError'
import { HelpModal } from './HelpModal'
import { LanguageModal } from './LanguageModal'
import {
  Alert,
  Button,
  Card,
  IconShield,
  PasswordInput,
} from './ui'

export function UnlockScreen() {
  const { isInitialized, setupVault, unlock, doImport, loading, clearError } = useVault()
  const vaultError = useVaultError()
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [showLanguage, setShowLanguage] = useState(false)

  const isSetup = isInitialized === false

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!password.trim()) {
      setLocalError(t.unlock.enterPassword)
      return
    }

    if (isSetup) {
      if (password.length < 8) {
        setLocalError(t.unlock.masterMinLength)
        return
      }
      if (password !== confirmPassword) {
        setLocalError(t.unlock.passwordsNoMatch)
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

  const displayError = localError || vaultError

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-vault-950 via-vault-900 to-vault-950" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vault-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-vault-accent/10 rounded-full blur-3xl" />

      <div className="absolute top-4 right-4 flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setShowHelp(true)}>
          {t.common.help}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowLanguage(true)}>
          {t.common.language}
        </Button>
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vault-500/20 text-vault-400 mb-4">
            <IconShield />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.appName}</h1>
          <p className="text-slate-400 text-sm">
            {isSetup ? t.unlock.setupSubtitle : t.unlock.unlockSubtitle}
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {displayError && (
              <Alert message={displayError} onDismiss={() => { setLocalError(null); clearError() }} />
            )}

            <PasswordInput
              label={t.unlock.masterPassword}
              hint={t.unlock.masterPasswordHint}
              value={password}
              onChange={setPassword}
              placeholder={t.unlock.enterMasterPassword}
              autoFocus
            />

            {isSetup && (
              <PasswordInput
                label={t.unlock.confirmMasterPassword}
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder={t.unlock.confirmMasterPasswordPlaceholder}
              />
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? t.common.pleaseWait
                : isSetup
                  ? t.unlock.createVault
                  : t.unlock.unlockVault}
            </Button>
          </form>

          {isSetup && (
            <div className="mt-6 pt-6 border-t border-vault-700/50">
              <p className="text-xs text-slate-500 text-center mb-3">
                {t.unlock.restoreBackup}
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <span className="flex items-center justify-center gap-2 w-full cursor-pointer rounded-xl border border-dashed border-vault-600 hover:border-vault-500 px-4 py-3 text-sm text-slate-400 hover:text-slate-300 transition-colors">
                  {t.unlock.importBackupFile}
                </span>
              </label>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-slate-600 mt-6">
          {t.unlock.localEncryptionNote}
        </p>
      </div>

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      <LanguageModal open={showLanguage} onClose={() => setShowLanguage(false)} />
    </div>
  )
}
