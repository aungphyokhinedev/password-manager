import { useEffect, useState } from 'react'
import { useVault } from '../context/VaultContext'
import { Button, IconLock, Modal, PasswordInput } from './ui'

interface PageUnlockModalProps {
  pageId: string
  pageTitle: string
  open: boolean
  onClose: () => void
}

export function PageUnlockModal({ pageId, pageTitle, open, onClose }: PageUnlockModalProps) {
  const { openPage, loading, error, clearError, activePage } = useVault()
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (open && activePage?.id === pageId) {
      setPassword('')
      onClose()
    }
  }, [activePage, pageId, open, onClose])

  async function handleUnlock() {
    if (!password.trim()) return
    clearError()
    await openPage(pageId, password)
  }

  function handleClose() {
    setPassword('')
    clearError()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Unlock Page">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-vault-800/50">
          <div className="text-vault-400">
            <IconLock />
          </div>
          <div>
            <p className="text-sm text-slate-400">Page</p>
            <p className="font-medium text-white">{pageTitle}</p>
          </div>
        </div>

        <PasswordInput
          label="Page Password"
          hint="Enter the password used to encrypt this page"
          value={password}
          onChange={setPassword}
          placeholder="Enter page password"
          autoFocus
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleUnlock} disabled={loading || !password}>
            {loading ? 'Unlocking...' : 'Unlock'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
