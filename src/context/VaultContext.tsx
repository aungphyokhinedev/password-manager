import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { DecryptedPage } from '../lib/types'
import {
  createPage,
  createVault,
  decryptPage,
  downloadExport,
  exportVault,
  getPageList,
  importVault,
  parseImportFile,
  removePage,
  resetVault,
  unlockVault,
  updatePage,
  vaultExists,
} from '../lib/vault'

interface VaultContextValue {
  isInitialized: boolean | null
  isUnlocked: boolean
  masterPassword: string | null
  pages: { id: string; title: string; updatedAt: number }[]
  activePage: DecryptedPage | null
  error: string | null
  loading: boolean
  setupVault: (password: string) => Promise<void>
  unlock: (password: string) => Promise<boolean>
  lock: () => void
  refreshPages: () => Promise<void>
  openPage: (pageId: string, pagePassword: string) => Promise<void>
  closePage: () => void
  addPage: (title: string, content: string, pagePassword: string) => Promise<void>
  savePage: (
    title: string,
    content: string,
    pagePassword: string,
    newPagePassword?: string,
  ) => Promise<void>
  deletePage: (pageId: string) => Promise<void>
  doExport: () => Promise<void>
  doImport: (file: File, replace: boolean) => Promise<void>
  destroyVault: () => Promise<void>
  clearError: () => void
}

const VaultContext = createContext<VaultContextValue | null>(null)

export function VaultProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [masterPassword, setMasterPassword] = useState<string | null>(null)
  const [pages, setPages] = useState<{ id: string; title: string; updatedAt: number }[]>([])
  const [activePage, setActivePage] = useState<DecryptedPage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    vaultExists().then(setIsInitialized)
  }, [])

  const refreshPages = useCallback(async () => {
    if (!masterPassword) return
    const list = await getPageList(masterPassword)
    setPages(list)
  }, [masterPassword])

  const setupVault = useCallback(async (password: string) => {
    setLoading(true)
    setError(null)
    try {
      await createVault(password)
      setMasterPassword(password)
      setIsInitialized(true)
      setIsUnlocked(true)
      setPages([])
    } catch {
      setError('Failed to create vault')
    } finally {
      setLoading(false)
    }
  }, [])

  const unlock = useCallback(async (password: string) => {
    setLoading(true)
    setError(null)
    try {
      const valid = await unlockVault(password)
      if (!valid) {
        setError('Incorrect master password')
        return false
      }
      setMasterPassword(password)
      setIsUnlocked(true)
      const list = await getPageList(password)
      setPages(list)
      return true
    } catch {
      setError('Failed to unlock vault')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const lock = useCallback(() => {
    setMasterPassword(null)
    setIsUnlocked(false)
    setActivePage(null)
    setPages([])
  }, [])

  const openPage = useCallback(
    async (pageId: string, pagePassword: string) => {
      if (!masterPassword) return
      setLoading(true)
      setError(null)
      try {
        const page = await decryptPage(pageId, pagePassword, masterPassword)
        setActivePage(page)
      } catch {
        setError('Incorrect page password or corrupted data')
      } finally {
        setLoading(false)
      }
    },
    [masterPassword],
  )

  const closePage = useCallback(() => {
    setActivePage(null)
  }, [])

  const addPage = useCallback(
    async (title: string, content: string, pagePassword: string) => {
      if (!masterPassword) return
      setLoading(true)
      setError(null)
      try {
        await createPage(masterPassword, title, content, pagePassword)
        await refreshPages()
      } catch {
        setError('Failed to create page')
      } finally {
        setLoading(false)
      }
    },
    [masterPassword, refreshPages],
  )

  const savePage = useCallback(
    async (
      title: string,
      content: string,
      pagePassword: string,
      newPagePassword?: string,
    ) => {
      if (!masterPassword || !activePage) return
      setLoading(true)
      setError(null)
      try {
        await updatePage(
          masterPassword,
          activePage.id,
          title,
          content,
          pagePassword,
          newPagePassword,
        )
        const updatedPassword = newPagePassword ?? pagePassword
        setActivePage({
          ...activePage,
          title,
          content,
          pagePassword: updatedPassword,
          updatedAt: Date.now(),
        })
        await refreshPages()
      } catch {
        setError('Failed to save page')
      } finally {
        setLoading(false)
      }
    },
    [masterPassword, activePage, refreshPages],
  )

  const deletePageFn = useCallback(
    async (pageId: string) => {
      setLoading(true)
      setError(null)
      try {
        await removePage(pageId)
        if (activePage?.id === pageId) {
          setActivePage(null)
        }
        await refreshPages()
      } catch {
        setError('Failed to delete page')
      } finally {
        setLoading(false)
      }
    },
    [activePage, refreshPages],
  )

  const doExport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await exportVault()
      downloadExport(data)
    } catch {
      setError('Failed to export vault')
    } finally {
      setLoading(false)
    }
  }, [])

  const doImport = useCallback(
    async (file: File, replace: boolean) => {
      setLoading(true)
      setError(null)
      try {
        const data = await parseImportFile(file)
        await importVault(data, replace)
        setIsInitialized(true)
        if (masterPassword) {
          const valid = await unlockVault(masterPassword)
          if (valid) {
            await refreshPages()
          } else {
            lock()
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to import vault')
      } finally {
        setLoading(false)
      }
    },
    [masterPassword, refreshPages, lock],
  )

  const destroyVault = useCallback(async () => {
    setLoading(true)
    try {
      await resetVault()
      lock()
      setIsInitialized(false)
    } catch {
      setError('Failed to reset vault')
    } finally {
      setLoading(false)
    }
  }, [lock])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo(
    () => ({
      isInitialized,
      isUnlocked,
      masterPassword,
      pages,
      activePage,
      error,
      loading,
      setupVault,
      unlock,
      lock,
      refreshPages,
      openPage,
      closePage,
      addPage,
      savePage,
      deletePage: deletePageFn,
      doExport,
      doImport,
      destroyVault,
      clearError,
    }),
    [
      isInitialized,
      isUnlocked,
      masterPassword,
      pages,
      activePage,
      error,
      loading,
      setupVault,
      unlock,
      lock,
      refreshPages,
      openPage,
      closePage,
      addPage,
      savePage,
      deletePageFn,
      doExport,
      doImport,
      destroyVault,
      clearError,
    ],
  )

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export function useVault() {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVault must be used within VaultProvider')
  return ctx
}
