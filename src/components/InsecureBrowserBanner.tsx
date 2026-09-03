import { useMemo, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { detectBrowserRisk, getBrowserName, type BrowserRisk } from '../lib/browser'
import { IconShield } from './ui'

const DISMISS_KEY = 'cipher-boy-browser-warning-dismissed'

export function InsecureBrowserBanner() {
  const { t } = useLanguage()
  const risk = useMemo(() => detectBrowserRisk(), [])
  const browserName = useMemo(() => getBrowserName(), [])
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === risk
    } catch {
      return false
    }
  })

  if (risk === 'ok' || dismissed) return null

  const copy = risk === 'in_app' ? t.browserWarning.inApp : t.browserWarning.unrecommended

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, risk)
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div
      role="alert"
      className={`w-full border-b px-4 py-3 ${
        risk === 'in_app'
          ? 'border-red-500/40 bg-red-500/10'
          : 'border-amber-500/30 bg-amber-500/10'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3 items-start">
        <div
          className={`shrink-0 mt-0.5 ${
            risk === 'in_app' ? 'text-red-400' : 'text-amber-400'
          }`}
        >
          <IconShield className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-semibold ${
              risk === 'in_app' ? 'text-red-200' : 'text-amber-200'
            }`}
          >
            {copy.title}
          </h3>
          <p className="text-xs text-slate-300/90 mt-1 leading-relaxed">
            {copy.body.replace('{browser}', browserName)}
          </p>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{copy.recommend}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-xs text-slate-400 hover:text-slate-200 transition-colors px-1"
          aria-label={t.common.close}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export type { BrowserRisk }
