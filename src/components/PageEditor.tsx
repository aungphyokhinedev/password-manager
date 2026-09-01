import { useState, type FormEvent } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useVault } from '../context/VaultContext'
import {
  parsePageContent,
  serializePageContent,
  type PageContentData,
} from '../lib/pageContent'
import { Button, Input, Modal, PasswordInput } from './ui'
import { ContentEditor } from './ContentEditor'

interface NewPageModalProps {
  open: boolean
  onClose: () => void
}

export function NewPageModal({ open, onClose }: NewPageModalProps) {
  const { addPage, loading } = useVault()
  const { t } = useLanguage()
  const [title, setTitle] = useState('')
  const [contentData, setContentData] = useState<PageContentData>({ type: 'text', text: '' })
  const [pagePassword, setPagePassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTitle('')
    setContentData({ type: 'text', text: '' })
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
      setError(t.page.enterPageTitle)
      return
    }

    const trimmedPassword = pagePassword.trim()
    if (trimmedPassword) {
      if (trimmedPassword.length < 4) {
        setError(t.page.pagePasswordMin)
        return
      }
      if (trimmedPassword !== confirmPassword) {
        setError(t.page.passwordsNoMatch)
        return
      }
    }

    await addPage(title.trim(), serializePageContent(contentData), trimmedPassword)
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={t.page.newPage}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-400">{error}</p>}

        <Input
          label={t.page.pageTitle}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.page.pageTitlePlaceholder}
          autoFocus
        />

        <ContentEditor
          value={contentData}
          onChange={setContentData}
          minHeight="min-h-[150px]"
        />

        <PasswordInput
          label={t.page.pagePasswordOptional}
          hint={t.page.pagePasswordHint}
          value={pagePassword}
          onChange={setPagePassword}
          placeholder={t.page.setPagePassword}
        />

        {pagePassword.trim() && (
          <PasswordInput
            label={t.page.confirmPagePassword}
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={t.page.confirmPagePassword}
          />
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? t.page.creating : t.page.createPage}
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
  const { t } = useLanguage()
  const [title, setTitle] = useState(activePage?.title ?? '')
  const [contentData, setContentData] = useState<PageContentData>(() =>
    parsePageContent(activePage?.content ?? ''),
  )
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!activePage) return null

  const pagePassword = activePage.pagePassword
  const isPasswordProtected = activePage.passwordProtected

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const serialized = serializePageContent(contentData)

    if (showChangePassword) {
      if (newPassword.trim()) {
        if (newPassword !== confirmNewPassword) {
          setError(t.page.passwordsNoMatch)
          return
        }
        if (newPassword.length < 4) {
          setError(t.page.pagePasswordMin)
          return
        }
        const success = await savePage(title, serialized, pagePassword, newPassword)
        if (success) onBack()
        return
      }

      if (isPasswordProtected) {
        const success = await savePage(title, serialized, pagePassword, '')
        if (success) onBack()
        return
      }
    }

    const success = await savePage(title, serialized, pagePassword)
    if (success) onBack()
  }

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          {t.common.back}
        </Button>
        <div className="flex-1" />
      </div>

      <form onSubmit={handleSave} className="flex-1 flex flex-col space-y-4">
        {error && <p className="text-sm text-red-400">{error}</p>}

        <Input
          label={t.page.title}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <ContentEditor value={contentData} onChange={setContentData} />

        <div className="border-t border-vault-700/50 pt-4">
          <button
            type="button"
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="text-sm text-vault-400 hover:text-vault-300 transition-colors"
          >
            {showChangePassword
              ? t.page.keepCurrentPassword
              : isPasswordProtected
                ? t.page.changeOrRemovePassword
                : t.page.addPagePassword}
          </button>

          {showChangePassword && (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-500">
                {isPasswordProtected
                  ? t.page.passwordChangeHintProtected
                  : t.page.passwordChangeHintUnprotected}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordInput
                  label={isPasswordProtected ? t.page.newPagePassword : t.page.pagePassword}
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder={isPasswordProtected ? t.page.newPasswordOrBlank : t.page.setPagePassword}
                />
                {newPassword.trim() && (
                  <PasswordInput
                    label={t.page.confirmPagePassword}
                    value={confirmNewPassword}
                    onChange={setConfirmNewPassword}
                    placeholder={t.page.confirmPagePassword}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? t.page.saving : t.page.savePage}
          </Button>
        </div>
      </form>
    </div>
  )
}
