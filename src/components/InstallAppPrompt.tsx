import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { usePwaInstall, type InstallGuide } from '../hooks/usePwaInstall'
import type { Translations } from '../i18n/types'
import { Button, IconInstall, IconShield, Modal } from './ui'

interface InstallAppPromptProps {
  variant?: 'banner' | 'card' | 'settings'
}

function guideContent(
  guide: InstallGuide,
  installApp: Translations['installApp'],
): { hint: string; steps: [string, string, string] } | null {
  if (guide === 'ios') return installApp.ios
  if (guide === 'android') return installApp.android
  if (guide === 'desktop') return installApp.desktop
  if (guide === 'firefox') return installApp.firefox
  if (guide === 'oneTap') return installApp.desktop
  return null
}

function GuideSteps({
  hint,
  steps,
  compact = false,
}: {
  hint: string
  steps: [string, string, string]
  compact?: boolean
}) {
  return (
    <div className={compact ? 'mt-2' : 'mt-1'}>
      <p className={`text-slate-400 leading-relaxed ${compact ? 'text-[11px] mb-2' : 'text-xs mb-3'}`}>
        {hint}
      </p>
      <ol className="space-y-2.5">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span
              className={`shrink-0 flex items-center justify-center rounded-full bg-vault-500/20 text-vault-300 font-semibold ${
                compact ? 'w-5 h-5 text-[10px] mt-0.5' : 'w-6 h-6 text-xs mt-0.5'
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-slate-300 leading-relaxed ${compact ? 'text-[11px]' : 'text-sm'}`}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function InstallHowToBody({ guide }: { guide: InstallGuide }) {
  const { t } = useLanguage()

  if (guide === 'blocked') {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 mb-5">
        <p className="text-sm text-amber-100/90 leading-relaxed">{t.installApp.blockedBody}</p>
      </div>
    )
  }

  const content = guideContent(guide, t.installApp)
  if (!content) {
    return <p className="text-sm text-slate-400 leading-relaxed mb-5">{t.installApp.subtitle}</p>
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-vault-500/15 text-vault-300 flex items-center justify-center">
          <IconInstall className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{t.installApp.howToTitle}</p>
          <p className="text-[11px] text-slate-500">{t.installApp.subtitle}</p>
        </div>
      </div>
      <div className="rounded-xl border border-vault-600/80 bg-vault-900/60 p-4">
        <GuideSteps hint={content.hint} steps={content.steps} />
      </div>
    </div>
  )
}

function HowToModal({
  open,
  onClose,
  guide,
}: {
  open: boolean
  onClose: () => void
  guide: InstallGuide
}) {
  const { t } = useLanguage()
  return (
    <Modal open={open} onClose={onClose} title={t.installApp.title}>
      <InstallHowToBody guide={guide} />
      <Button className="w-full" onClick={onClose}>
        {t.common.close}
      </Button>
    </Modal>
  )
}

/** Compact Install button for the header — one-tap or opens accurate how-to */
export function HeaderInstallButton() {
  const { t } = useLanguage()
  const { guide, canOneTapInstall, installing, install, installed } = usePwaInstall()
  const [showHowTo, setShowHowTo] = useState(false)

  if (installed || guide === 'blocked') return null

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
      <HowToModal open={showHowTo} onClose={() => setShowHowTo(false)} guide={guide} />
    </>
  )
}

export function InstallAppPrompt({ variant = 'banner' }: InstallAppPromptProps) {
  const { t } = useLanguage()
  const { guide, canShowPrompt, canOneTapInstall, installing, install, dismiss, installed } =
    usePwaInstall()
  const [showHowTo, setShowHowTo] = useState(false)

  if (variant === 'settings') {
    if (installed) {
      return (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
          <p className="text-xs text-emerald-400/90">{t.installApp.alreadyInstalled}</p>
        </div>
      )
    }

    if (guide === 'blocked') {
      return (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5">
          <p className="text-xs text-amber-100/90 leading-relaxed">{t.installApp.blockedBody}</p>
        </div>
      )
    }

    if (canOneTapInstall) {
      return (
        <Button className="w-full justify-start" onClick={() => void install()} disabled={installing}>
          <IconInstall />
          {installing ? t.common.pleaseWait : t.installApp.installButton}
        </Button>
      )
    }

    const content = guideContent(guide, t.installApp)
    if (!content) return null

    return (
      <div className="rounded-xl border border-vault-600/80 bg-vault-900/40 p-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <IconInstall className="w-4 h-4 text-vault-300" />
          <p className="text-sm font-medium text-white">{t.installApp.title}</p>
        </div>
        <GuideSteps hint={content.hint} steps={content.steps} compact />
      </div>
    )
  }

  if (!canShowPrompt) return null

  const content = guideContent(guide, t.installApp)
  const showSteps = guide !== 'oneTap' && guide !== 'blocked' && content

  if (variant === 'card') {
    return (
      <div className="mt-4 rounded-2xl border border-vault-500/25 bg-gradient-to-b from-vault-800/70 to-vault-900/50 p-4 animate-fade-in">
        <div className="flex gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-vault-500/15 text-vault-300 flex items-center justify-center">
            <IconShield className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">{t.installApp.title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.installApp.subtitle}</p>

            {guide === 'blocked' && (
              <p className="mt-2 text-xs text-amber-200/85 leading-relaxed">{t.installApp.blockedBody}</p>
            )}

            {showSteps && content && (
              <div className="mt-3 rounded-xl border border-vault-600/60 bg-vault-950/40 p-3">
                <GuideSteps hint={content.hint} steps={content.steps} compact />
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {canOneTapInstall && (
                <Button size="sm" onClick={() => void install()} disabled={installing}>
                  <IconInstall />
                  {installing ? t.common.pleaseWait : t.installApp.installButton}
                </Button>
              )}
              {!canOneTapInstall && guide !== 'blocked' && (
                <Button size="sm" variant="secondary" onClick={() => setShowHowTo(true)}>
                  {t.installApp.howToTitle}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={dismiss}>
                {t.installApp.notNow}
              </Button>
            </div>
          </div>
        </div>
        <HowToModal open={showHowTo} onClose={() => setShowHowTo(false)} guide={guide} />
      </div>
    )
  }

  // banner
  return (
    <div className="w-full border-b border-vault-500/25 bg-vault-500/8 px-4 py-3 animate-fade-in">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-vault-500/15 text-vault-300 flex items-center justify-center">
            <IconInstall className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">{t.installApp.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {guide === 'blocked'
                ? t.installApp.blockedBody
                : canOneTapInstall
                  ? t.installApp.subtitle
                  : content?.hint ?? t.installApp.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 sm:pl-2">
          {canOneTapInstall ? (
            <Button size="sm" onClick={() => void install()} disabled={installing}>
              <IconInstall />
              {installing ? t.common.pleaseWait : t.installApp.installButton}
            </Button>
          ) : guide !== 'blocked' ? (
            <Button size="sm" variant="secondary" onClick={() => setShowHowTo(true)}>
              {t.installApp.howToTitle}
            </Button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 transition-colors"
          >
            {t.installApp.notNow}
          </button>
        </div>
      </div>
      <HowToModal open={showHowTo} onClose={() => setShowHowTo(false)} guide={guide} />
    </div>
  )
}
