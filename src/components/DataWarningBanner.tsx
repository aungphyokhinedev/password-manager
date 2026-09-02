import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { Button, IconDownload, IconShield } from './ui'

interface DataWarningBannerProps {
  onExport: () => void
  loading?: boolean
  dataRevision: number
}

const VISIBLE_COUNT = 2

export function DataWarningBanner({ onExport, loading, dataRevision }: DataWarningBannerProps) {
  const { t } = useLanguage()
  const w = t.dashboard.dataWarning
  const [expanded, setExpanded] = useState(false)
  const [emphasize, setEmphasize] = useState(false)
  const prevRevision = useRef(dataRevision)

  const points = [
    w.masterPassword,
    w.exportBackup,
    w.exportSaveLocation,
    w.exportEncrypted,
    w.localOnly,
    w.otherBrowser,
  ]

  const visiblePoints = points.slice(0, VISIBLE_COUNT)
  const hiddenPoints = points.slice(VISIBLE_COUNT)
  const hiddenCount = hiddenPoints.length

  useEffect(() => {
    if (dataRevision > prevRevision.current) {
      prevRevision.current = dataRevision
      setEmphasize(true)
      const timer = window.setTimeout(() => setEmphasize(false), 2200)
      return () => window.clearTimeout(timer)
    }
    prevRevision.current = dataRevision
  }, [dataRevision])

  return (
    <div
      className={`mb-5 rounded-xl border bg-amber-500/5 overflow-hidden transition-colors animate-fade-in ${
        emphasize
          ? 'border-amber-400/70 animate-warning-emphasis'
          : 'border-amber-500/30'
      }`}
    >
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 ${
              emphasize ? 'animate-warning-icon' : ''
            }`}
          >
            <IconShield />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold text-amber-200 text-sm leading-snug">{w.title}</h3>
              <Button
                size="sm"
                className="shrink-0 h-8 text-xs px-3"
                onClick={onExport}
                disabled={loading}
                aria-label={t.dashboard.exportVault}
              >
                <IconDownload />
                <span className="hidden sm:inline">{t.dashboard.exportVault}</span>
              </Button>
            </div>

            <ul className="space-y-1.5">
              {visiblePoints.map((text, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
                  <span className="shrink-0 text-amber-500/70">•</span>
                  <span>{text}</span>
                </li>
              ))}

              {expanded &&
                hiddenPoints.map((text, i) => (
                  <li
                    key={i + VISIBLE_COUNT}
                    className="flex gap-2 text-xs text-slate-400 leading-relaxed animate-fade-in"
                  >
                    <span className="shrink-0 text-amber-500/70">•</span>
                    <span>{text}</span>
                  </li>
                ))}
            </ul>

            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-2 text-xs font-medium text-amber-400/90 hover:text-amber-300 transition-colors"
              >
                {expanded ? t.common.readLess : t.common.readMore}
                {!expanded && ` (${hiddenCount})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
