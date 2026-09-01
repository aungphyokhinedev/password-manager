export const MAX_TABLE_COLUMNS = 5

export interface TextContent {
  type: 'text'
  text: string
}

export interface TableContent {
  type: 'table'
  columns: string[]
  rows: string[][]
}

export type PageContentData = TextContent | TableContent

export function createEmptyTable(columnCount = 3): TableContent {
  const count = Math.min(Math.max(columnCount, 1), MAX_TABLE_COLUMNS)
  return {
    type: 'table',
    columns: Array.from({ length: count }, (_, i) => `Column ${i + 1}`),
    rows: [Array.from({ length: count }, () => '')],
  }
}

export function parsePageContent(raw: string): PageContentData {
  if (!raw.trim()) {
    return { type: 'text', text: '' }
  }

  try {
    const parsed = JSON.parse(raw) as PageContentData
    if (parsed.type === 'table' && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
      const columns = parsed.columns
        .slice(0, MAX_TABLE_COLUMNS)
        .map((c) => (typeof c === 'string' ? c : String(c)))
      const colCount = Math.max(columns.length, 1)
      const rows = parsed.rows.map((row) => {
        const cells = Array.isArray(row) ? row.map((c) => (typeof c === 'string' ? c : String(c))) : []
        while (cells.length < colCount) cells.push('')
        return cells.slice(0, colCount)
      })
      return { type: 'table', columns, rows: rows.length ? rows : [Array.from({ length: colCount }, () => '')] }
    }
    if (parsed.type === 'text' && typeof parsed.text === 'string') {
      return { type: 'text', text: parsed.text }
    }
  } catch {
    // Legacy plain-text content
  }

  return { type: 'text', text: raw }
}

export function serializePageContent(data: PageContentData): string {
  if (data.type === 'text') {
    return JSON.stringify({ type: 'text', text: data.text })
  }
  return JSON.stringify({
    type: 'table',
    columns: data.columns.slice(0, MAX_TABLE_COLUMNS),
    rows: data.rows.map((row) => row.slice(0, data.columns.length)),
  })
}

export function tableToPlainText(data: TableContent): string {
  const header = data.columns.join('\t')
  const body = data.rows.map((row) => row.join('\t')).join('\n')
  return `${header}\n${body}`
}
