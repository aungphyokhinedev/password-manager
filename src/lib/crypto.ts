const PBKDF2_ITERATIONS = 600_000
const SALT_LENGTH = 16
const IV_LENGTH = 12

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function fromBase64(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  return toBase64(salt.buffer)
}

export function generateId(): string {
  return crypto.randomUUID()
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function createVerificationHash(
  password: string,
  salt: string,
): Promise<string> {
  const key = await deriveKey(password, fromBase64(salt))
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode('vault-verification-token'),
  )
  return toBase64(iv.buffer) + ':' + toBase64(encrypted)
}

export async function verifyPassword(
  password: string,
  salt: string,
  verificationHash: string,
): Promise<boolean> {
  try {
    const [ivB64, cipherB64] = verificationHash.split(':')
    const key = await deriveKey(password, fromBase64(salt))
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(ivB64) },
      key,
      fromBase64(cipherB64),
    )
    const text = new TextDecoder().decode(decrypted)
    return text === 'vault-verification-token'
  } catch {
    return false
  }
}

export async function encrypt(
  plaintext: string,
  password: string,
  salt?: string,
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const saltB64 = salt ?? generateSalt()
  const key = await deriveKey(password, fromBase64(saltB64))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoder = new TextEncoder()

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )

  return {
    ciphertext: toBase64(encrypted),
    iv: toBase64(iv.buffer),
    salt: saltB64,
  }
}

export async function decrypt(
  ciphertext: string,
  password: string,
  salt: string,
  iv: string,
): Promise<string> {
  const key = await deriveKey(password, fromBase64(salt))
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    key,
    fromBase64(ciphertext),
  )
  return new TextDecoder().decode(decrypted)
}

export async function encryptWithMasterKey(
  plaintext: string,
  masterPassword: string,
  vaultSalt: string,
): Promise<{ ciphertext: string; iv: string }> {
  const key = await deriveKey(masterPassword, fromBase64(vaultSalt))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoder = new TextEncoder()

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )

  return {
    ciphertext: toBase64(encrypted),
    iv: toBase64(iv.buffer),
  }
}

export async function decryptWithMasterKey(
  ciphertext: string,
  masterPassword: string,
  vaultSalt: string,
  iv: string,
): Promise<string> {
  const key = await deriveKey(masterPassword, fromBase64(vaultSalt))
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    key,
    fromBase64(ciphertext),
  )
  return new TextDecoder().decode(decrypted)
}
