/**
 * Detects in-app / embedded browsers that often clear site data
 * (IndexedDB, localStorage) when the app is closed.
 */

const IN_APP_PATTERNS = [
  /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i, // Facebook
  /Instagram/i,
  /Messenger/i,
  /Line\//i,
  /TikTok|musical_ly|BytedanceWebview|TTWebView/i,
  /Twitter|X\/\d/i,
  /LinkedInApp/i,
  /Snapchat/i,
  /MicroMessenger/i, // WeChat
  /WhatsApp/i,
  /Telegram/i,
  /Pinterest/i,
  /Discord/i,
  /GSA\//i, // Google Search App
  /; wv\)/i, // Android WebView
]

export type BrowserRisk = 'in_app' | 'unrecommended' | 'ok'

export function detectBrowserRisk(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''): BrowserRisk {
  if (!userAgent) return 'unrecommended'

  if (IN_APP_PATTERNS.some((re) => re.test(userAgent))) {
    return 'in_app'
  }

  if (isRecommendedBrowser(userAgent)) {
    return 'ok'
  }

  return 'unrecommended'
}

function isRecommendedBrowser(ua: string): boolean {
  // Order matters: Chrome-based browsers include "Safari" and "Chrome"
  if (/Edg\//i.test(ua)) return true // Microsoft Edge
  if (/OPR\/|Opera/i.test(ua)) return true
  if (/SamsungBrowser/i.test(ua)) return true
  if (/Firefox|FxiOS/i.test(ua)) return true
  if (/Chrome|CriOS|Chromium/i.test(ua) && !/; wv\)/i.test(ua)) return true
  // Safari (not Chrome/Chromium disguised)
  if (/Safari/i.test(ua) && !/Chrome|CriOS|Chromium|Android/i.test(ua)) return true
  return false
}

export function getBrowserName(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''): string {
  if (/FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(userAgent)) return 'Facebook'
  if (/Instagram/i.test(userAgent)) return 'Instagram'
  if (/Messenger/i.test(userAgent)) return 'Messenger'
  if (/Line\//i.test(userAgent)) return 'LINE'
  if (/TikTok|musical_ly|BytedanceWebview|TTWebView/i.test(userAgent)) return 'TikTok'
  if (/MicroMessenger/i.test(userAgent)) return 'WeChat'
  if (/WhatsApp/i.test(userAgent)) return 'WhatsApp'
  if (/Telegram/i.test(userAgent)) return 'Telegram'
  if (/; wv\)/i.test(userAgent)) return 'WebView'
  if (/Edg\//i.test(userAgent)) return 'Edge'
  if (/OPR\/|Opera/i.test(userAgent)) return 'Opera'
  if (/SamsungBrowser/i.test(userAgent)) return 'Samsung Internet'
  if (/Firefox|FxiOS/i.test(userAgent)) return 'Firefox'
  if (/Chrome|CriOS/i.test(userAgent)) return 'Chrome'
  if (/Safari/i.test(userAgent)) return 'Safari'
  return 'Unknown'
}
