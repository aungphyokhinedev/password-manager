import { useLanguage } from '../context/LanguageContext'
import { languageLabels, languages } from '../i18n/types'
import { Button, Modal } from './ui'

interface LanguageModalProps {
  open: boolean
  onClose: () => void
}

export function LanguageModal({ open, onClose }: LanguageModalProps) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <Modal open={open} onClose={onClose} title={t.language.title}>
      <p className="text-slate-400 text-sm mb-5">{t.language.subtitle}</p>
      <div className="space-y-2">
        {languages.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => {
              setLanguage(lang)
              onClose()
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
              language === lang
                ? 'border-vault-500 bg-vault-500/10 text-white'
                : 'border-vault-700/50 bg-vault-800/30 text-slate-300 hover:border-vault-600 hover:bg-vault-800/50'
            }`}
          >
            <span className="font-medium">{languageLabels[lang]}</span>
            {language === lang && (
              <span className="text-vault-400 text-sm">✓</span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-vault-700/50">
        <Button variant="secondary" className="w-full" onClick={onClose}>
          {t.common.cancel}
        </Button>
      </div>
    </Modal>
  )
}
