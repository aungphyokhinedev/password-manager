import { useState, type FormEvent } from 'react'
import { useVault } from '../context/VaultContext'
import { Button, Input, Modal, PasswordInput, Textarea } from './ui'

interface NewPageModalProps {
  open: boolean
  onClose: () => void
}

export function NewPageModal({ open, onClose }: NewPageModalProps) {
  const { addPage, loading } = useVault()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pagePassword, setPagePassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTitle('')
    setContent('')
    setPagePassword('')
    setConfirmPassword('')
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Please enter a page title')
      return
    }
    if (!pagePassword.trim()) {
      setError('Please set a page password')
      return
    }
    if (pagePassword.length < 4) {
      setError('Page password must be at least 4 characters')
      return
    }
    if (pagePassword !== confirmPassword) {
      setError('Page passwords do not match')
      return
    }

    await addPage(title.trim(), content, pagePassword)
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Secure Page">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-400">{error}</p>}

        <Input
          label="Page Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Bank Accounts, Work Passwords"
          autoFocus
        />

        <Textarea
          label="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your passwords, notes, or any sensitive data..."
          className="min-h-[150px]"
        />

        <PasswordInput
          label="Page Password"
          hint="Each page has its own password. Required for new pages."
          value={pagePassword}
          onChange={setPagePassword}
          placeholder="Set a unique page password"
        />

        <PasswordInput
          label="Confirm Page Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm page password"
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Creating...' : 'Create Page'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface PageEditorProps {
  onBack: () => void
}

export function PageEditor({ onBack }: PageEditorProps) {
  const { activePage, savePage, loading } = useVault()
  const [title, setTitle] = useState(activePage?.title ?? '')
  const [content, setContent] = useState(activePage?.content ?? '')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!activePage) return null

  const pagePassword = activePage.pagePassword

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    if (showChangePassword) {
      if (!newPassword.trim()) {
        setError('Please enter a new password')
        return
      }
      if (newPassword !== confirmNewPassword) {
        setError('New passwords do not match')
        return
      }
      await savePage(title, content, pagePassword, newPassword)
    } else {
      await savePage(title, content, pagePassword)
    }

    setSaved(true)
    setShowChangePassword(false)
    setNewPassword('')
    setConfirmNewPassword('')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex-1" />
        {saved && (
          <span className="text-sm text-emerald-400 animate-fade-in">Saved securely</span>
        )}
      </div>

      <form onSubmit={handleSave} className="flex-1 flex flex-col space-y-4">
        {error && <p className="text-sm text-red-400">{error}</p>}

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          label="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 min-h-[400px]"
        />

        <div className="border-t border-vault-700/50 pt-4">
          <button
            type="button"
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="text-sm text-vault-400 hover:text-vault-300 transition-colors"
          >
            {showChangePassword ? '− Keep current page password' : '+ Change page password (optional)'}
          </button>

          {showChangePassword && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <PasswordInput
                label="New Page Password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password"
              />
              <PasswordInput
                label="Confirm New Password"
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
                placeholder="Confirm new password"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Page'}
          </Button>
        </div>
      </form>
    </div>
  )
}
