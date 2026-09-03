import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import {
  createEmptyTable,
  MAX_TABLE_COLUMNS,
  type PageContentData,
  type TableContent,
} from '../lib/pageContent'
import { Button, IconTable, IconText, Textarea } from './ui'

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
        aria-label={t.content.text}
        title={t.content.text}
        className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${
          value.type === 'text'
            ? 'bg-vault-500 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <IconText />
      </button>
      <button
        type="button"
        onClick={() => {
          if (value.type !== 'table') {
            onChange(createEmptyTable(3))
          }
        }}
        aria-label={t.content.table}
        title={t.content.table}
        className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${
          value.type === 'table'
            ? 'bg-vault-500 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <IconTable />
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

  async function copyCell(rowIndex: number, colIndex: number, text: string) {
    if (!text) return
    await navigator.clipboard.writeText(text)
    const key = `${rowIndex}-${colIndex}`
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1200)
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
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr className="border-b border-vault-600/80 bg-vault-800/40">
              {value.columns.map((col, colIndex) => (
                <th key={colIndex} className="p-1.5 align-middle min-w-[120px]">
                  <input
                    type="text"
                    value={col}
                    onChange={(e) => setColumnName(colIndex, e.target.value)}
                    placeholder={`${t.content.column} ${colIndex + 1}`}
                    className="w-full rounded-md border-0 bg-transparent px-2 py-1.5 text-xs font-semibold text-slate-200 placeholder:text-slate-500 outline-none focus:bg-vault-900/60 focus:ring-1 focus:ring-vault-500"
                  />
                </th>
              ))}
              <th className="p-1.5 w-9" />
            </tr>
          </thead>
          <tbody>
            {value.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-vault-700/40 last:border-b-0">
                {value.columns.map((_, colIndex) => {
                  const cellKey = `${rowIndex}-${colIndex}`
                  const cellValue = row[colIndex] ?? ''
                  const justCopied = copiedKey === cellKey
                  return (
                    <td key={colIndex} className="p-1 align-middle">
                      <input
                        type="text"
                        value={cellValue}
                        onChange={(e) => setCell(rowIndex, colIndex, e.target.value)}
                        onDoubleClick={() => copyCell(rowIndex, colIndex, cellValue)}
                        placeholder="—"
                        title={t.content.doubleClickCopy}
                        className={`w-full rounded-md border-0 bg-transparent px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:bg-vault-950/80 focus:ring-1 focus:ring-vault-500 ${
                          justCopied ? 'ring-1 ring-emerald-400/70 bg-emerald-500/10' : ''
                        }`}
                      />
                    </td>
                  )
                })}
                <td className="p-1 align-middle">
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    disabled={value.rows.length <= 1}
                    className="p-1 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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

      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-t border-vault-700/50 bg-vault-800/20">
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
        <span className="ml-auto text-[11px] text-slate-500">{t.content.doubleClickCopy}</span>
      </div>
    </div>
  )
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
