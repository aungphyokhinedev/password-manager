export const VAULT_VERSION = 1

export interface VaultMeta {
  version: number
  salt: string
  verificationHash: string
  createdAt: number
}

export interface EncryptedPage {
  id: string
  encryptedTitle: string
  titleIv: string
  salt: string
  iv: string
  ciphertext: string
  createdAt: number
  updatedAt: number
}

export interface VaultExport {
  version: number
  exportedAt: number
  meta: VaultMeta
  pages: EncryptedPage[]
}

export interface PageContent {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface DecryptedPage extends PageContent {
  pagePassword: string
}
