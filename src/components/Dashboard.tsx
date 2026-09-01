import { useRef, useState } from 'react'
import { useVault } from '../context/VaultContext'
import {
  Alert,
  Button,
  Card,
  IconDownload,
  IconLock,
  IconPlus,
  IconShield,
  IconTrash,
  IconUpload,
  Modal,
} from './ui'
import { NewPageModal, PageEditor } from './PageEditor'
import { PageUnlockModal } from './PageUnlockModal'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Dashboard() {
  const {
    pages,
    activePage,
    closePage,
    lock,
    deletePage,
    doExport,
    doImport,
    destroyVault,
    loading,
    error,
    clearError,
  } = useVault()

  const [showNewPage, setShowNewPage] = useState(false)
  const [unlockPage, setUnlockPage] = useState<{ id: string; title: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    clearError()
    await doImport(file, false)
    e.target.value = ''
  }

  if (activePage) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLock={lock} onSettings={() => setShowSettings(true)} />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
          <PageEditor onBack={closePage} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLock={lock} onSettings={() => setShowSettings(true)} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Pages</h2>
            <p className="text-slate-400 text-sm mt-1">
              {pages.length === 0
                ? 'Create your first secure page'
                : `${pages.length} encrypted page${pages.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button onClick={() => setShowNewPage(true)}>
            <IconPlus />
            New Page
          </Button>
        </div>

        {error && (
          <div className="mb-6">
            <Alert message={error} onDismiss={clearError} />
          </div>
        )}

        {pages.length === 0 ? (
          <Card className="p-12 text-center animate-fade-in animate-fade-in-delay-1">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vault-800 text-vault-400 mb-4">
              <IconLock />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No pages yet</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Create a secure page to store passwords, notes, or any sensitive information.
              Each page has its own encryption password.
            </p>
            <Button onClick={() => setShowNewPage(true)}>
              <IconPlus />
              Create First Page
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {pages.map((page, i) => (
              <Card
                key={page.id}
                className={`p-4 flex items-center gap-4 hover:border-vault-500/40 transition-colors cursor-pointer group animate-fade-in animate-fade-in-delay-${Math.min(i + 1, 3)}`}
                onClick={() => setUnlockPage({ id: page.id, title: page.title })}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-vault-800 text-vault-400 group-hover:bg-vault-500/20 group-hover:text-vault-300 transition-colors">
                  <IconLock />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{page.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Updated {formatDate(page.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteConfirm(page.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  aria-label="Delete page"
                >
                  <IconTrash />
                </button>
              </Card>
            ))}
          </div>
        )}
      </main>

      <NewPageModal open={showNewPage} onClose={() => setShowNewPage(false)} />

      {unlockPage && (
        <PageUnlockModal
          pageId={unlockPage.id}
          pageTitle={unlockPage.title}
          open={true}
          onClose={() => setUnlockPage(null)}
        />
      )}

      <Modal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Page"
      >
        <p className="text-slate-400 text-sm mb-6">
          This will permanently delete this page and its encrypted data. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            disabled={loading}
            onClick={async () => {
              if (deleteConfirm) {
                await deletePage(deleteConfirm)
                setDeleteConfirm(null)
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <div className="space-y-3">
          <Button variant="secondary" className="w-full justify-start" onClick={doExport}>
            <IconDownload />
            Export Vault Backup
          </Button>

          <input
            ref={importRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={() => importRef.current?.click()}
          >
            <IconUpload />
            Import & Merge Backup
          </Button>

          <div className="border-t border-vault-700/50 pt-3 mt-3">
            <Button
              variant="danger"
              className="w-full"
              onClick={async () => {
                if (confirm('This will permanently delete ALL data. Are you sure?')) {
                  await destroyVault()
                  setShowSettings(false)
                }
              }}
            >
              Reset Vault (Delete All Data)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Header({ onLock, onSettings }: { onLock: () => void; onSettings: () => void }) {
  return (
    <header className="border-b border-vault-800/80 bg-vault-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="text-vault-400">
            <IconShield />
          </div>
          <span className="font-semibold text-white">Vault</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSettings}>
            Settings
          </Button>
          <Button variant="secondary" size="sm" onClick={onLock}>
            Lock
          </Button>
        </div>
      </div>
    </header>
  )
}
