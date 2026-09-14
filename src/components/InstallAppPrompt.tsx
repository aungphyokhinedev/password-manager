import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { Button, IconInstall, IconShield, Modal } from './ui'

interface InstallAppPromptProps {
  /** Compact top banner vs card under unlock form */
  variant?: 'banner' | 'card' | 'settings'
}

/** Icon button for the app header — one-tap install or opens how-to modal */
export function HeaderInstallButton() {
  const { t } = useLanguage()
  const { platform, canOneTapInstall, installing, install, installed } = usePwaInstall()
  const [showHowTo, setShowHowTo] = useState(false)

  if (installed || platform === 'blocked') return null

  async function handleClick() {
    if (canOneTapInstall) {
      await install()
      return
    }
    setShowHowTo(true)
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="!px-2.5 !py-1.5 gap-1.5 text-xs font-medium"
        onClick={() => void handleClick()}
        disabled={installing}
        aria-label={t.installApp.installButton}
        title={t.installApp.installButton}
      >
        <IconInstall />
        <span>{t.installApp.shortLabel}</span>
      </Button>

      <Modal open={showHowTo} onClose={() => setShowHowTo(false)} title={t.installApp.title}>
        {platform === 'ios' ? (
          <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside leading-relaxed mb-5">
            <li>{t.installApp.iosStep1}</li>
            <li>{t.installApp.iosStep2}</li>
            <li>{t.installApp.iosStep3}</li>
          </ol>
        ) : (
          <p className="text-sm text-slate-400 leading-relaxed mb-5">{t.installApp.manualBody}</p>
        )}
        <Button className="w-full" onClick={() => setShowHowTo(false)}>
          {t.common.close}
        </Button>
      </Modal>
    </>
  )
}

export function InstallAppPrompt({ variant = 'banner' }: InstallAppPromptProps) {
  const { t } = useLanguage()
  const { platform, canShowPrompt, canOneTapInstall, installing, install, dismiss, installed } =
    usePwaInstall()

  if (variant === 'settings') {
    if (installed) {
      return (
        <p className="text-xs text-emerald-400/90 px-1">{t.installApp.alreadyInstalled}</p>
      )
    }

    if (platform === 'blocked') {
      return (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs text-slate-400 leading-relaxed">{t.installApp.blockedBody}</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {platform === 'ios' ? (
          <div className="rounded-xl border border-vault-600 bg-vault-800/40 p-3">
            <p className="text-sm font-medium text-white mb-1">{t.installApp.title}</p>
            <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
              <li>{t.installApp.iosStep1}</li>
              <li>{t.installApp.iosStep2}</li>
              <li>{t.installApp.iosStep3}</li>
            </ol>
          </div>
        ) : canOneTapInstall ? (
          <Button className="w-full justify-start" onClick={() => void install()} disabled={installing}>
            <IconInstall />
            {installing ? t.common.pleaseWait : t.installApp.installButton}
          </Button>
        ) : (
          <div className="rounded-xl border border-vault-600 bg-vault-800/40 p-3">
            <p className="text-sm font-medium text-white mb-1">{t.installApp.title}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{t.installApp.manualBody}</p>
          </div>
        )}
      </div>
    )
  }

  if (!canShowPrompt) return null

  if (variant === 'card') {
    return (
      <div className="mt-4 rounded-2xl border border-vault-500/30 bg-vault-800/50 p-4 animate-fade-in">
        <div className="flex gap-3">
          <div className="shrink-0 text-vault-400 mt-0.5">
            <IconShield className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">{t.installApp.title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.installApp.subtitle}</p>

            {platform === 'ios' && (
              <ol className="mt-2 text-xs text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
                <li>{t.installApp.iosStep1}</li>
                <li>{t.installApp.iosStep2}</li>
                <li>{t.installApp.iosStep3}</li>
              </ol>
            )}

            {platform === 'blocked' && (
              <p className="mt-2 text-xs text-amber-200/80 leading-relaxed">{t.installApp.blockedBody}</p>
            )}

            {platform === 'manual' && (
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">{t.installApp.manualBody}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {canOneTapInstall && (
                <Button size="sm" onClick={() => void install()} disabled={installing}>
                  <IconInstall />
                  {installing ? t.common.pleaseWait : t.installApp.installButton}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={dismiss}>
                {t.installApp.notNow}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // banner
  return (
    <div className="w-full border-b border-vault-500/30 bg-vault-500/10 px-4 py-3 animate-fade-in">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="shrink-0 text-vault-300 mt-0.5">
            <IconShield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">{t.installApp.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {platform === 'blocked'
                ? t.installApp.blockedBody
                : platform === 'ios'
                  ? t.installApp.iosHint
                  : platform === 'manual'
                    ? t.installApp.manualBody
                    : t.installApp.subtitle}
            </p>
            {platform === 'ios' && (
              <ol className="mt-1.5 text-[11px] text-slate-500 space-y-0.5 list-decimal list-inside">
                <li>{t.installApp.iosStep1}</li>
                <li>{t.installApp.iosStep2}</li>
                <li>{t.installApp.iosStep3}</li>
              </ol>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 sm:pl-2">
          {canOneTapInstall && (
            <Button size="sm" onClick={() => void install()} disabled={installing}>
              <IconInstall />
              {installing ? t.common.pleaseWait : t.installApp.installButton}
            </Button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 transition-colors"
          >
            {t.installApp.notNow}
          </button>
        </div>
      </div>
    </div>
  )
}
