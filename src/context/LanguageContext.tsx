import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { languages, type Language, type Translations } from '../i18n/types'
import { interpolate, translations } from '../i18n/translations'

const STORAGE_KEY = 'vault-language'

const htmlLangMap: Record<Language, string> = {
  en: 'en',
  my: 'my',
  zh: 'zh-CN',
  ja: 'ja',
  ko: 'ko',
}

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
  tf: (text: string, vars: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && languages.includes(stored as Language)) {
    return stored as Language
  }
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage)

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = htmlLangMap[lang]
  }, [])

  useEffect(() => {
    document.documentElement.lang = htmlLangMap[language]
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
      tf: interpolate,
    }),
    [language, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
