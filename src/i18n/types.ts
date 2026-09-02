export type Language = 'en' | 'my' | 'zh' | 'ja' | 'ko'

export interface HelpStep {
  title: string
  body: string
}

export interface Translations {
  appName: string
  common: {
    cancel: string
    delete: string
    save: string
    back: string
    show: string
    hide: string
    settings: string
    lock: string
    help: string
    language: string
    pleaseWait: string
    close: string
    readMore: string
    readLess: string
  }
  unlock: {
    setupSubtitle: string
    unlockSubtitle: string
    masterPassword: string
    masterPasswordHint: string
    confirmMasterPassword: string
    enterMasterPassword: string
    confirmMasterPasswordPlaceholder: string
    createVault: string
    unlockVault: string
    restoreBackup: string
    importBackupFile: string
    localEncryptionNote: string
    enterPassword: string
    masterMinLength: string
    passwordsNoMatch: string
  }
  dashboard: {
    yourPages: string
    createFirstPage: string
    pageCount: string
    pageCountOne: string
    newPage: string
    noPagesYet: string
    noPagesDesc: string
    createFirstPageBtn: string
    updated: string
    open: string
    deletePage: string
    deletePageDesc: string
    exportVault: string
    importMerge: string
    resetVault: string
    dataWarning: {
      title: string
      masterPassword: string
      exportBackup: string
      exportSaveLocation: string
      exportEncrypted: string
      localOnly: string
      otherBrowser: string
    }
  }
  page: {
    newPage: string
    pageTitle: string
    pageTitlePlaceholder: string
    pagePasswordOptional: string
    pagePasswordHint: string
    confirmPagePassword: string
    setPagePassword: string
    creating: string
    createPage: string
    saving: string
    savePage: string
    title: string
    changeOrRemovePassword: string
    addPagePassword: string
    keepCurrentPassword: string
    passwordChangeHintProtected: string
    passwordChangeHintUnprotected: string
    newPagePassword: string
    newPasswordOrBlank: string
    pagePasswordMin: string
    passwordsNoMatch: string
    unlockPage: string
    pageLabel: string
    pagePassword: string
    pagePasswordUnlockHint: string
    enterPagePassword: string
    unlocking: string
    unlock: string
    enterPageTitle: string
  }
  content: {
    content: string
    text: string
    table: string
    textPlaceholder: string
    copyColumn: string
    copied: string
    addRow: string
    addColumn: string
    removeLastColumn: string
    column: string
  }
  reset: {
    title: string
    desc: string
    pageWord: string
    pagesWord: string
    backupTitle: string
    backupDesc: string
    exportNow: string
    exporting: string
    exportAgain: string
    backupSuccess: string
    confirmCheckbox: string
    deleting: string
    deleteEverything: string
    cannotBeUndone: string
  }
  help: {
    title: string
    subtitle: string
    steps: HelpStep[]
    dataProtection: {
      title: string
      intro: string
      points: HelpStep[]
    }
    securityNote: string
  }
  language: {
    title: string
    subtitle: string
    english: string
    burmese: string
    chinese: string
    japanese: string
    korean: string
  }
  errors: {
    incorrectMaster: string
    failedUnlock: string
    failedCreateVault: string
    incorrectPagePassword: string
    failedCreatePage: string
    failedSavePage: string
    failedDeletePage: string
    failedExport: string
    failedImport: string
    failedReset: string
  }
}

export const languageLabels: Record<Language, string> = {
  en: 'English',
  my: 'မြန်မာ',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
}

export const languages: Language[] = ['en', 'my', 'zh', 'ja', 'ko']
