import { LanguageProvider } from './context/LanguageContext'
import { VaultProvider, useVault } from './context/VaultContext'
import { Dashboard } from './components/Dashboard'
import { InsecureBrowserBanner } from './components/InsecureBrowserBanner'
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

  return (
    <div className="h-dvh min-h-screen flex flex-col overflow-hidden">
      <InsecureBrowserBanner />
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        {isUnlocked ? <Dashboard /> : <UnlockScreen />}
      </div>
    </div>
  )
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
