import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useVault } from '../context/VaultContext'
import { useVaultError } from '../hooks/useVaultError'
import { Button, IconLock, Modal, PasswordInput } from './ui'

interface PageUnlockModalProps {
  pageId: string
  pageTitle: string
  open: boolean
  onClose: () => void
}

export function PageUnlockModal({ pageId, pageTitle, open, onClose }: PageUnlockModalProps) {
  const { openPage, loading, clearError } = useVault()
  const vaultError = useVaultError()
  const { t } = useLanguage()
  const [password, setPassword] = useState('')

  async function handleUnlock() {
    if (!password.trim()) return
    clearError()
    const success = await openPage(pageId, password)
    if (success) {
      setPassword('')
      onClose()
    }
  }

  function handleClose() {
    setPassword('')
    clearError()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={t.page.unlockPage}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-vault-800/50">
          <div className="text-vault-400">
            <IconLock />
          </div>
          <div>
            <p className="text-sm text-slate-400">{t.page.pageLabel}</p>
            <p className="font-medium text-white">{pageTitle}</p>
          </div>
        </div>

        <PasswordInput
          label={t.page.pagePassword}
          hint={t.page.pagePasswordUnlockHint}
          value={password}
          onChange={setPassword}
          placeholder={t.page.enterPagePassword}
          autoFocus
        />

        {vaultError && <p className="text-sm text-red-400">{vaultError}</p>}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button className="flex-1" onClick={handleUnlock} disabled={loading || !password}>
            {loading ? t.page.unlocking : t.page.unlock}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
