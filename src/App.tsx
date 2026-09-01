import { LanguageProvider } from './context/LanguageContext'
import { VaultProvider, useVault } from './context/VaultContext'
import { Dashboard } from './components/Dashboard'
import { UnlockScreen } from './components/UnlockScreen'

function AppContent() {
  const { isInitialized, isUnlocked } = useVault()

  if (isInitialized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-vault-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isUnlocked) {
    return <UnlockScreen />
  }

  return <Dashboard />
}

export default function App() {
  return (
    <LanguageProvider>
      <VaultProvider>
        <AppContent />
      </VaultProvider>
    </LanguageProvider>
  )
}
