import { useCallback, useEffect, useState } from 'react'
import { detectBrowserRisk } from '../lib/browser'

const DISMISS_KEY = 'cipher-boy-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Which install guide / flow to show the user */
export type InstallGuide =
  | 'installed'
  | 'blocked'
  | 'oneTap'
  | 'ios'
  | 'android'
  | 'desktop'
  | 'firefox'

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    nav.standalone === true
  )
}

function isIosDevice(ua: string): boolean {
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document)
}

function isIosSafari(ua: string): boolean {
  if (!isIosDevice(ua)) return false
  // Chrome/Firefox/Edge on iOS are not Safari — they can't add PWAs the same way
  if (/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)) return false
  return /Safari/i.test(ua) || /WebKit/i.test(ua)
}

function isAndroid(ua: string): boolean {
  return /Android/i.test(ua)
}

function isFirefox(ua: string): boolean {
  return /Firefox|FxiOS/i.test(ua)
}

function isChromiumDesktop(ua: string): boolean {
  if (isAndroid(ua) || isIosDevice(ua)) return false
  return /Chrome|Edg\/|OPR\/|Chromium/i.test(ua) && !/Firefox/i.test(ua)
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

  const guide: InstallGuide = (() => {
    if (installed) return 'installed'
    if (typeof navigator === 'undefined') return 'desktop'
    if (detectBrowserRisk() === 'in_app') return 'blocked'

    const ua = navigator.userAgent

    // Native install prompt available (Chrome/Edge/Android Chrome)
    if (deferredPrompt) return 'oneTap'

    if (isIosSafari(ua)) return 'ios'
    if (isIosDevice(ua)) return 'ios' // other iOS browsers: still show Safari-oriented guidance
    if (isFirefox(ua)) return 'firefox'
    if (isAndroid(ua)) return 'android'
    if (isChromiumDesktop(ua)) return 'desktop'
    return 'desktop'
  })()

  const canShowPrompt = !installed && !dismissed && guide !== 'installed'
  const canOneTapInstall = guide === 'oneTap' && !!deferredPrompt

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
    guide,
    /** @deprecated use guide */
    platform: guide === 'oneTap' ? 'chromium' : guide,
    canShowPrompt,
    canOneTapInstall,
    installing,
    installed,
    install,
    dismiss,
  }
}
