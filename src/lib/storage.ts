import type { EncryptedPage, VaultMeta } from './types'

const DB_NAME = 'secure-vault'
const DB_VERSION = 1
const META_STORE = 'meta'
const PAGES_STORE = 'pages'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(PAGES_STORE)) {
        db.createObjectStore(PAGES_STORE, { keyPath: 'id' })
      }
    }
  })
}

export async function getVaultMeta(): Promise<VaultMeta | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readonly')
    const store = tx.objectStore(META_STORE)
    const request = store.get('vault')

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result
      resolve(result ? (result as VaultMeta & { id: string }) : null)
    }
  })
}

export async function saveVaultMeta(meta: VaultMeta): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite')
    const store = tx.objectStore(META_STORE)
    const request = store.put({ ...meta, id: 'vault' })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getAllPages(): Promise<EncryptedPage[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PAGES_STORE, 'readonly')
    const store = tx.objectStore(PAGES_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as EncryptedPage[])
  })
}

export async function getPage(id: string): Promise<EncryptedPage | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PAGES_STORE, 'readonly')
    const store = tx.objectStore(PAGES_STORE)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve((request.result as EncryptedPage) ?? null)
  })
}

export async function savePage(page: EncryptedPage): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PAGES_STORE, 'readwrite')
    const store = tx.objectStore(PAGES_STORE)
    const request = store.put(page)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function deletePage(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PAGES_STORE, 'readwrite')
    const store = tx.objectStore(PAGES_STORE)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function clearAllData(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([META_STORE, PAGES_STORE], 'readwrite')
    tx.objectStore(META_STORE).clear()
    tx.objectStore(PAGES_STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function importVaultData(
  meta: VaultMeta,
  pages: EncryptedPage[],
  replace: boolean,
): Promise<void> {
  if (replace) {
    await clearAllData()
  }
  await saveVaultMeta(meta)
  for (const page of pages) {
    await savePage(page)
  }
}
