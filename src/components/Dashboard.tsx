import { useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useVault } from '../context/VaultContext'
import { useVaultError } from '../hooks/useVaultError'
import { DataWarningBanner } from './DataWarningBanner'
import { HelpModal } from './HelpModal'
import { LanguageModal } from './LanguageModal'
import {
  Alert,
  Button,
  Card,
  IconDownload,
  IconLock,
  IconOpenDoor,
  IconPlus,
  IconShield,
  IconTrash,
  IconUpload,
  Modal,
} from './ui'
import { NewPageModal, PageEditor } from './PageEditor'
import { PageUnlockModal } from './PageUnlockModal'
import { ResetVaultModal } from './ResetVaultModal'

function formatDate(ts: number, lang: string) {
  const locale =
    lang === 'my' ? 'my-MM'
    : lang === 'zh' ? 'zh-CN'
    : lang === 'ja' ? 'ja-JP'
    : lang === 'ko' ? 'ko-KR'
    : undefined
  return new Date(ts).toLocaleDateString(locale, {
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
    openPage,
    lock,
    deletePage,
    doExport,
    doImport,
    loading,
    dataRevision,
    clearError,
  } = useVault()
  const vaultError = useVaultError()
  const { t, tf, language } = useLanguage()

  const [showNewPage, setShowNewPage] = useState(false)
  const [unlockPage, setUnlockPage] = useState<{ id: string; title: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showResetVault, setShowResetVault] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showLanguage, setShowLanguage] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    clearError()
    await doImport(file, false)
    e.target.value = ''
  }

  function handleClosePage() {
    setUnlockPage(null)
    closePage()
  }

  async function handleOpenPage(page: {
    id: string
    title: string
    passwordProtected: boolean
  }) {
    if (page.passwordProtected) {
      setUnlockPage({ id: page.id, title: page.title })
      return
    }
    clearError()
    await openPage(page.id, '')
  }

  const pageCountLabel =
    pages.length === 1
      ? tf(t.dashboard.pageCountOne, { count: pages.length })
      : tf(t.dashboard.pageCount, { count: pages.length })

  const modals = (
    <>
      <NewPageModal open={showNewPage} onClose={() => setShowNewPage(false)} />

      {unlockPage && !activePage && (
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
        title={t.dashboard.deletePage}
      >
        <p className="text-slate-400 text-sm mb-6">{t.dashboard.deletePageDesc}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>
            {t.common.cancel}
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
            {t.common.delete}
          </Button>
        </div>
      </Modal>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title={t.common.settings}>
        <div className="space-y-3">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 mb-1">
            <p className="text-slate-400 text-xs leading-relaxed">{t.dashboard.dataWarning.exportSaveLocation}</p>
            <p className="text-indigo-200/80 text-xs leading-relaxed mt-2">{t.dashboard.dataWarning.exportEncrypted}</p>
          </div>

          <Button variant="secondary" className="w-full justify-start" onClick={doExport}>
            <IconDownload />
            {t.dashboard.exportVault}
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
            {t.dashboard.importMerge}
          </Button>

          <div className="border-t border-vault-700/50 pt-3 mt-3">
            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                setShowSettings(false)
                setShowResetVault(true)
              }}
            >
              {t.dashboard.resetVault}
            </Button>
          </div>
        </div>
      </Modal>

      <ResetVaultModal
        open={showResetVault}
        onClose={() => setShowResetVault(false)}
        pageCount={pages.length}
      />

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      <LanguageModal open={showLanguage} onClose={() => setShowLanguage(false)} />
    </>
  )

  if (activePage) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header
          onLock={lock}
          onSettings={() => setShowSettings(true)}
          onHelp={() => setShowHelp(true)}
          onLanguage={() => setShowLanguage(true)}
        />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
          <PageEditor onBack={handleClosePage} />
        </main>
        {modals}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onLock={lock}
        onSettings={() => setShowSettings(true)}
        onHelp={() => setShowHelp(true)}
        onLanguage={() => setShowLanguage(true)}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-white">{t.dashboard.yourPages}</h2>
            <p className="text-slate-400 text-sm mt-1">
              {pages.length === 0 ? t.dashboard.createFirstPage : pageCountLabel}
            </p>
          </div>
          <Button onClick={() => setShowNewPage(true)}>
            <IconPlus />
            {t.dashboard.newPage}
          </Button>
        </div>

        {vaultError && (
          <div className="mb-6">
            <Alert message={vaultError} onDismiss={clearError} />
          </div>
        )}

        {pages.length === 0 ? (
          <Card className="p-12 text-center animate-fade-in animate-fade-in-delay-1">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vault-800 text-vault-400 mb-4">
              <IconLock />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t.dashboard.noPagesYet}</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">{t.dashboard.noPagesDesc}</p>
            <Button onClick={() => setShowNewPage(true)}>
              <IconPlus />
              {t.dashboard.createFirstPageBtn}
            </Button>
          </Card>
        ) : (
          <>
            <DataWarningBanner
              onExport={doExport}
              loading={loading}
              dataRevision={dataRevision}
            />
            <div className="grid gap-3">
            {pages.map((page, i) => (
              <Card
                key={page.id}
                className={`p-4 flex items-center gap-4 hover:border-vault-500/40 transition-colors cursor-pointer group animate-fade-in animate-fade-in-delay-${Math.min(i + 1, 3)}`}
                onClick={() => handleOpenPage(page)}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                  page.passwordProtected
                    ? 'bg-vault-800 text-vault-400 group-hover:bg-vault-500/20 group-hover:text-vault-300'
                    : 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300'
                }`}>
                  {page.passwordProtected ? <IconLock /> : <IconOpenDoor />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white truncate">{page.title}</h3>
                    {!page.passwordProtected && (
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-emerald-500/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {t.dashboard.open}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.dashboard.updated} {formatDate(page.updatedAt, language)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteConfirm(page.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  aria-label={t.common.delete}
                >
                  <IconTrash />
                </button>
              </Card>
            ))}
            </div>
          </>
        )}
      </main>

      {modals}
    </div>
  )
}

function Header({
  onLock,
  onSettings,
  onHelp,
  onLanguage,
}: {
  onLock: () => void
  onSettings: () => void
  onHelp: () => void
  onLanguage: () => void
}) {
  const { t } = useLanguage()

  return (
    <header className="border-b border-vault-800/80 bg-vault-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="text-vault-400">
            <IconShield />
          </div>
          <span className="font-semibold text-white">{t.appName}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={onHelp}>
            {t.common.help}
          </Button>
          <Button variant="ghost" size="sm" onClick={onLanguage}>
            {t.common.language}
          </Button>
          <Button variant="ghost" size="sm" onClick={onSettings}>
            {t.common.settings}
          </Button>
          <Button variant="secondary" size="sm" onClick={onLock}>
            {t.common.lock}
          </Button>
        </div>
      </div>
    </header>
  )
}
