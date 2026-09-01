import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useVault } from '../context/VaultContext'
import { Button, IconDownload, IconTrash, Modal } from './ui'

interface ResetVaultModalProps {
  open: boolean
  onClose: () => void
  pageCount: number
}

export function ResetVaultModal({ open, onClose, pageCount }: ResetVaultModalProps) {
  const { doExport, destroyVault, loading } = useVault()
  const { t } = useLanguage()
  const [exported, setExported] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [resetting, setResetting] = useState(false)

  function handleClose() {
    setExported(false)
    setExporting(false)
    setConfirmed(false)
    setResetting(false)
    onClose()
  }

  async function handleExport() {
    setExporting(true)
    try {
      await doExport()
      setExported(true)
    } finally {
      setExporting(false)
    }
  }

  async function handleReset() {
    if (!confirmed) return
    setResetting(true)
    try {
      await destroyVault()
      handleClose()
    } finally {
      setResetting(false)
    }
  }

  const pageWord = pageCount !== 1 ? t.reset.pagesWord : t.reset.pageWord

  return (
    <Modal open={open} onClose={handleClose} title="" size="lg">
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/15 text-red-400 mb-4 ring-1 ring-red-500/20">
            <IconTrash className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t.reset.title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            {t.reset.desc}{' '}
            <span className="text-white font-medium">
              {pageCount} {pageWord}
            </span>
            . {t.reset.cannotBeUndone}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex gap-3 mb-4">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <IconDownload />
            </div>
            <div>
              <h3 className="font-semibold text-amber-200 text-sm">{t.reset.backupTitle}</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">{t.reset.backupDesc}</p>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleExport}
            disabled={exporting || loading}
          >
            <IconDownload />
            {exporting ? t.reset.exporting : exported ? t.reset.exportAgain : t.reset.exportNow}
          </Button>

          {exported && (
            <p className="text-center text-xs text-emerald-400 mt-3 animate-fade-in">
              {t.reset.backupSuccess}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-vault-700/50 bg-vault-800/30 p-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-vault-600 bg-vault-900 text-vault-500 focus:ring-vault-500/30 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm text-slate-300 leading-relaxed group-hover:text-slate-200 transition-colors">
              {t.reset.confirmCheckbox}
            </span>
          </label>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            disabled={!confirmed || resetting || loading}
            onClick={handleReset}
          >
            {resetting ? t.reset.deleting : t.reset.deleteEverything}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
