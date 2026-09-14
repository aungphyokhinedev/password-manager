import { useCallback, useEffect, useState } from 'react'
import { detectBrowserRisk } from '../lib/browser'

const DISMISS_KEY = 'cipher-boy-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallPlatform = 'chromium' | 'ios' | 'manual' | 'installed' | 'blocked'

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    nav.standalone === true
  )
}

function isIosSafari(ua: string): boolean {
  const iOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && 'ontouchend' in document)
  const webkit = /WebKit/i.test(ua)
  const notOther = !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Android/i.test(ua)
  return iOS && webkit && notOther
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandaloneDisplay())
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  const [installing, setInstalling] = useState(false)

  const platform: InstallPlatform = (() => {
    if (installed) return 'installed'
    if (typeof navigator === 'undefined') return 'manual'
    if (detectBrowserRisk() === 'in_app') return 'blocked'
    const ua = navigator.userAgent
    if (isIosSafari(ua)) return 'ios'
    if (deferredPrompt) return 'chromium'
    return 'manual'
  })()

  const canShowPrompt = !installed && !dismissed && platform !== 'installed'

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    function onInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    const media = window.matchMedia('(display-mode: standalone)')
    const onDisplayChange = () => {
      if (isStandaloneDisplay()) setInstalled(true)
    }
    media.addEventListener?.('change', onDisplayChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      media.removeEventListener?.('change', onDisplayChange)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      if (outcome === 'accepted') {
        setInstalled(true)
        return true
      }
      return false
    } catch {
      return false
    } finally {
      setInstalling(false)
    }
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }, [])

  return {
    platform,
    canShowPrompt,
    canOneTapInstall: platform === 'chromium' && !!deferredPrompt,
    installing,
    installed,
    install,
    dismiss,
  }
}
