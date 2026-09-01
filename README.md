# Vault — Secure Notes

A beautiful, client-side encrypted vault for storing passwords, notes, and sensitive data. All encryption happens locally in your browser — your data never leaves your device.

## Features

- **Master password** — Protects your entire vault
- **Per-page encryption** — Each page has its own password for extra security
- **Edit without re-entering password** — Once unlocked, save changes using the same page password
- **Optional password change** — Update a page's password when saving
- **Export / Import** — Backup and restore your encrypted vault as a JSON file
- **Zero server** — 100% client-side, works offline

## Security

- AES-256-GCM encryption via Web Crypto API
- PBKDF2 key derivation (600,000 iterations, SHA-256)
- Unique salt per vault and per page
- Master password verification without storing plaintext
- Data stored in IndexedDB (browser-local)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

1. **First launch** — Create a master password (minimum 8 characters)
2. **Create a page** — Add a title, content, and a unique page password
3. **Open a page** — Enter the page password to decrypt and view
4. **Edit & save** — Changes are re-encrypted with the same password (or set a new one)
5. **Export** — Settings → Export Vault Backup
6. **Import** — Settings → Import & Merge Backup

> **Important:** If you forget your master password or a page password, your data cannot be recovered. There is no backdoor.

## Build

```bash
npm run build
npm run preview
```
