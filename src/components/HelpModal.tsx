import { useLanguage } from '../context/LanguageContext'
import { Button, IconShield, Modal } from './ui'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const { t } = useLanguage()

  return (
    <Modal open={open} onClose={onClose} title={t.help.title} size="lg">
      <p className="text-slate-400 text-sm mb-6">{t.help.subtitle}</p>

      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {t.help.steps.map((step, i) => (
          <div
            key={i}
            className="rounded-xl border border-vault-700/50 bg-vault-800/30 p-4"
          >
            <h3 className="font-semibold text-white text-sm mb-2">{step.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="shrink-0 text-amber-400 mt-0.5">
          <IconShield />
        </div>
        <p className="text-amber-200/80 text-xs leading-relaxed">{t.help.securityNote}</p>
      </div>

      <div className="mt-5 pt-4 border-t border-vault-700/50">
        <Button className="w-full" onClick={onClose}>
          {t.common.close}
        </Button>
      </div>
    </Modal>
  )
}
