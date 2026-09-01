import {
  createVerificationHash,
  decrypt,
  decryptWithMasterKey,
  encrypt,
  encryptWithMasterKey,
  generateId,
  generateSalt,
  verifyPassword,
} from './crypto'
import {
  clearAllData,
  deletePage,
  getAllPages,
  getPage,
  getVaultMeta,
  importVaultData,
  savePage,
  saveVaultMeta,
} from './storage'
import type {
  DecryptedPage,
  EncryptedPage,
  VaultExport,
  VaultMeta,
} from './types'
import { VAULT_VERSION } from './types'

export async function vaultExists(): Promise<boolean> {
  const meta = await getVaultMeta()
  return meta !== null
}

export async function createVault(masterPassword: string): Promise<void> {
  const salt = generateSalt()
  const verificationHash = await createVerificationHash(masterPassword, salt)
  const meta: VaultMeta = {
    version: VAULT_VERSION,
    salt,
    verificationHash,
    createdAt: Date.now(),
  }
  await saveVaultMeta(meta)
}

export async function unlockVault(masterPassword: string): Promise<boolean> {
  const meta = await getVaultMeta()
  if (!meta) return false
  return verifyPassword(masterPassword, meta.salt, meta.verificationHash)
}

export async function getPageList(
  masterPassword: string,
): Promise<{ id: string; title: string; updatedAt: number; passwordProtected: boolean }[]> {
  const meta = await getVaultMeta()
  if (!meta) return []

  const pages = await getAllPages()
  const results: { id: string; title: string; updatedAt: number; passwordProtected: boolean }[] = []

  for (const page of pages) {
    try {
      const title = await decryptWithMasterKey(
        page.encryptedTitle,
        masterPassword,
        meta.salt,
        page.titleIv,
      )
      results.push({
        id: page.id,
        title,
        updatedAt: page.updatedAt,
        passwordProtected: page.passwordProtected !== false,
      })
    } catch {
      results.push({
        id: page.id,
        title: '[Unable to decrypt title]',
        updatedAt: page.updatedAt,
        passwordProtected: page.passwordProtected !== false,
      })
    }
  }

  return results.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function createPage(
  masterPassword: string,
  title: string,
  content: string,
  pagePassword: string,
): Promise<string> {
  const meta = await getVaultMeta()
  if (!meta) throw new Error('Vault not initialized')

  const id = generateId()
  const now = Date.now()
  const passwordProtected = pagePassword.length > 0

  const { ciphertext, iv, salt } = await encrypt(content, pagePassword)
  const { ciphertext: encryptedTitle, iv: titleIv } = await encryptWithMasterKey(
    title,
    masterPassword,
    meta.salt,
  )

  const page: EncryptedPage = {
    id,
    encryptedTitle,
    titleIv,
    salt,
    iv,
    ciphertext,
    passwordProtected,
    createdAt: now,
    updatedAt: now,
  }

  await savePage(page)
  return id
}

export async function decryptPage(
  pageId: string,
  pagePassword: string,
  masterPassword: string,
): Promise<DecryptedPage> {
  const meta = await getVaultMeta()
  if (!meta) throw new Error('Vault not initialized')

  const page = await getPage(pageId)
  if (!page) throw new Error('Page not found')

  const passwordProtected = page.passwordProtected !== false
  const title = await decryptWithMasterKey(
    page.encryptedTitle,
    masterPassword,
    meta.salt,
    page.titleIv,
  )
  const content = await decrypt(page.ciphertext, pagePassword, page.salt, page.iv)

  return {
    id: page.id,
    title,
    content,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    pagePassword: passwordProtected ? pagePassword : '',
    passwordProtected,
  }
}

export async function updatePage(
  masterPassword: string,
  pageId: string,
  title: string,
  content: string,
  pagePassword: string,
  newPagePassword?: string,
): Promise<void> {
  const meta = await getVaultMeta()
  if (!meta) throw new Error('Vault not initialized')

  const existing = await getPage(pageId)
  if (!existing) throw new Error('Page not found')

  const isPasswordChange = newPagePassword !== undefined
  const passwordToUse = isPasswordChange ? newPagePassword : pagePassword
  const passwordProtected = passwordToUse.length > 0
  const saltToUse = isPasswordChange ? undefined : existing.salt

  const { ciphertext, iv, salt } = await encrypt(content, passwordToUse, saltToUse)
  const { ciphertext: encryptedTitle, iv: titleIv } = await encryptWithMasterKey(
    title,
    masterPassword,
    meta.salt,
  )

  const page: EncryptedPage = {
    id: pageId,
    encryptedTitle,
    titleIv,
    salt,
    iv,
    ciphertext,
    passwordProtected,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  }

  await savePage(page)
}

export async function removePage(pageId: string): Promise<void> {
  await deletePage(pageId)
}

export async function exportVault(): Promise<VaultExport> {
  const meta = await getVaultMeta()
  if (!meta) throw new Error('Vault not initialized')

  const pages = await getAllPages()
  return {
    version: VAULT_VERSION,
    exportedAt: Date.now(),
    meta,
    pages,
  }
}

export async function importVault(
  data: VaultExport,
  replace: boolean,
): Promise<void> {
  if (data.version !== VAULT_VERSION) {
    throw new Error('Unsupported vault version')
  }
  await importVaultData(data.meta, data.pages, replace)
}

export async function resetVault(): Promise<void> {
  await clearAllData()
}

export function downloadExport(data: VaultExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cipher-boy-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseImportFile(file: File): Promise<VaultExport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as VaultExport
        if (!data.meta || !data.pages) {
          reject(new Error('Invalid vault file format'))
          return
        }
        resolve(data)
      } catch {
        reject(new Error('Failed to parse vault file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
