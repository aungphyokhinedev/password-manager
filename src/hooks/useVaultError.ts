import { useLanguage } from '../context/LanguageContext'
import { useVault } from '../context/VaultContext'

export function useVaultError(): string | null {
  const { error } = useVault()
  const { t } = useLanguage()
  if (!error) return null
  return t.errors[error]
}
