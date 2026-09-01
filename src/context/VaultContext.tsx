import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ErrorCode } from '../i18n/translations'
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
  pages: { id: string; title: string; updatedAt: number; passwordProtected: boolean }[]
  activePage: DecryptedPage | null
  error: ErrorCode | null
  loading: boolean
  setupVault: (password: string) => Promise<void>
  unlock: (password: string) => Promise<boolean>
  lock: () => void
  refreshPages: () => Promise<void>
  openPage: (pageId: string, pagePassword: string) => Promise<boolean>
  closePage: () => void
  addPage: (title: string, content: string, pagePassword: string) => Promise<void>
  savePage: (
    title: string,
    content: string,
    pagePassword: string,
    newPagePassword?: string,
  ) => Promise<boolean>
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
  const [pages, setPages] = useState<{ id: string; title: string; updatedAt: number; passwordProtected: boolean }[]>([])
  const [activePage, setActivePage] = useState<DecryptedPage | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
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
      setError('failedCreateVault')
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
        setError('incorrectMaster')
        return false
      }
      setMasterPassword(password)
      setIsUnlocked(true)
      const list = await getPageList(password)
      setPages(list)
      return true
    } catch {
      setError('failedUnlock')
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
      if (!masterPassword) return false
      setLoading(true)
      setError(null)
      try {
        const page = await decryptPage(pageId, pagePassword, masterPassword)
        setActivePage(page)
        return true
      } catch {
        setError('incorrectPagePassword')
        return false
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
        setError('failedCreatePage')
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
      if (!masterPassword || !activePage) return false
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
        const updatedPassword = newPagePassword !== undefined ? newPagePassword : pagePassword
        setActivePage({
          ...activePage,
          title,
          content,
          pagePassword: updatedPassword,
          passwordProtected: updatedPassword.length > 0,
          updatedAt: Date.now(),
        })
        await refreshPages()
        return true
      } catch {
        setError('failedSavePage')
        return false
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
        setError('failedDeletePage')
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
      setError('failedExport')
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
      } catch {
        setError('failedImport')
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
      setError('failedReset')
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
