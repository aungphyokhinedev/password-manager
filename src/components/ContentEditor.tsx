import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import {
  createEmptyTable,
  MAX_TABLE_COLUMNS,
  type PageContentData,
  type TableContent,
} from '../lib/pageContent'
import { Button, Textarea } from './ui'

interface ContentEditorProps {
  value: PageContentData
  onChange: (value: PageContentData) => void
  minHeight?: string
}

export function ContentEditor({ value, onChange, minHeight = 'min-h-[400px]' }: ContentEditorProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-300">{t.content.content}</label>
        <ContentTypeToggle value={value} onChange={onChange} />
      </div>

      {value.type === 'text' ? (
        <Textarea
          value={value.text}
          onChange={(e) => onChange({ type: 'text', text: e.target.value })}
          placeholder={t.content.textPlaceholder}
          className={minHeight}
        />
      ) : (
        <TableEditor value={value} onChange={onChange} />
      )}
    </div>
  )
}

function ContentTypeToggle({
  value,
  onChange,
}: {
  value: PageContentData
  onChange: (value: PageContentData) => void
}) {
  const { t } = useLanguage()

  return (
    <div className="flex rounded-xl border border-vault-600 bg-vault-900/80 p-1">
      <button
        type="button"
        onClick={() => {
          if (value.type !== 'text') {
            onChange({ type: 'text', text: '' })
          }
        }}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          value.type === 'text'
            ? 'bg-vault-500 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {t.content.text}
      </button>
      <button
        type="button"
        onClick={() => {
          if (value.type !== 'table') {
            onChange(createEmptyTable(3))
          }
        }}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          value.type === 'table'
            ? 'bg-vault-500 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {t.content.table}
      </button>
    </div>
  )
}

function TableEditor({
  value,
  onChange,
}: {
  value: TableContent
  onChange: (value: PageContentData) => void
}) {
  const { t } = useLanguage()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  function update(updater: (current: TableContent) => TableContent) {
    onChange(updater(value))
  }

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  function copyColumn(colIndex: number) {
    const lines = value.rows.map((row) => row[colIndex] ?? '').filter(Boolean)
    copyText(`col-${colIndex}`, lines.join('\n'))
  }

  function setColumnName(colIndex: number, name: string) {
    update((current) => {
      const columns = [...current.columns]
      columns[colIndex] = name
      return { ...current, columns }
    })
  }

  function setCell(rowIndex: number, colIndex: number, cell: string) {
    update((current) => {
      const rows = current.rows.map((row, ri) =>
        ri === rowIndex ? row.map((c, ci) => (ci === colIndex ? cell : c)) : row,
      )
      return { ...current, rows }
    })
  }

  function addRow() {
    update((current) => ({
      ...current,
      rows: [...current.rows, Array.from({ length: current.columns.length }, () => '')],
    }))
  }

  function removeRow(rowIndex: number) {
    update((current) => ({
      ...current,
      rows: current.rows.filter((_, i) => i !== rowIndex),
    }))
  }

  function addColumn() {
    if (value.columns.length >= MAX_TABLE_COLUMNS) return
    update((current) => ({
      ...current,
      columns: [...current.columns, `${t.content.column} ${current.columns.length + 1}`],
      rows: current.rows.map((row) => [...row, '']),
    }))
  }

  function removeColumn(colIndex: number) {
    if (value.columns.length <= 1) return
    update((current) => ({
      ...current,
      columns: current.columns.filter((_, i) => i !== colIndex),
      rows: current.rows.map((row) => row.filter((_, i) => i !== colIndex)),
    }))
  }

  return (
    <div className="rounded-2xl border border-vault-600 bg-vault-900/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border-collapse">
          <thead>
            <tr className="border-b border-vault-600/80 bg-vault-800/40">
              {value.columns.map((col, colIndex) => (
                <th key={colIndex} className="p-2 align-top min-w-[140px]">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => setColumnName(colIndex, e.target.value)}
                      placeholder={`${t.content.column} ${colIndex + 1}`}
                      className="w-full rounded-lg border border-vault-600 bg-vault-900/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 placeholder:text-slate-500 outline-none focus:border-vault-500"
                    />
                    <button
                      type="button"
                      onClick={() => copyColumn(colIndex)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-vault-600/80 bg-vault-900/60 px-2 py-1 text-[11px] text-slate-400 hover:text-vault-300 hover:border-vault-500/50 transition-colors"
                    >
                      <IconCopy />
                      {copiedKey === `col-${colIndex}` ? t.content.copied : t.content.copyColumn}
                    </button>
                  </div>
                </th>
              ))}
              <th className="p-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {value.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-vault-700/40 hover:bg-vault-800/20">
                {value.columns.map((_, colIndex) => (
                  <td key={colIndex} className="p-2 align-top">
                    <div className="relative group">
                      <input
                        type="text"
                        value={row[colIndex] ?? ''}
                        onChange={(e) => setCell(rowIndex, colIndex, e.target.value)}
                        placeholder="—"
                        className="w-full rounded-lg border border-vault-700/60 bg-vault-950/50 px-2.5 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-vault-500 pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => copyText(`cell-${rowIndex}-${colIndex}`, row[colIndex] ?? '')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-600 hover:text-vault-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy cell"
                      >
                        {copiedKey === `cell-${rowIndex}-${colIndex}` ? (
                          <span className="text-[10px] text-emerald-400">✓</span>
                        ) : (
                          <IconCopy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                ))}
                <td className="p-2 align-middle">
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    disabled={value.rows.length <= 1}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Remove row"
                  >
                    <IconTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-3 border-t border-vault-700/50 bg-vault-800/20">
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
          {t.content.addRow}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addColumn}
          disabled={value.columns.length >= MAX_TABLE_COLUMNS}
        >
          {t.content.addColumn} ({value.columns.length}/{MAX_TABLE_COLUMNS})
        </Button>
        {value.columns.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeColumn(value.columns.length - 1)}
          >
            {t.content.removeLastColumn}
          </Button>
        )}
      </div>
    </div>
  )
}

function IconCopy({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 011.927-.184"
      />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
