import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  fetchDynamicRecords,
  deleteDynamicRecord,
  createDynamicRecord,
  updateDynamicRecord,
  clearDynamicData,
  type RelatedInfo,
} from '../store/slices/dynamicDataSlice'
import { showSuccessToast, showErrorToast } from '../store/slices/toastSlice'
import {
  Plus, Search, Pencil, Trash2, Loader2, ArrowLeft, Database,
  Check, X, CornerDownLeft, ArrowUpDown,
} from 'lucide-react'
import type { CustomField } from '../store/slices/customTablesSlice'

// ─── Cell formatters (read-only display) ──────────────────────────────────────

const formatCellValue = (value: unknown, type: string, related?: RelatedInfo[]): string => {
  if (value === null || value === undefined || value === '') return '—'
  switch (type) {
    case 'date':
      try { return new Date(value as string).toLocaleDateString() } catch { return String(value) }
    case 'daterange':
      if (typeof value === 'object' && value !== null) {
        const range = value as { start?: string; end?: string }
        const start = range.start ? new Date(range.start).toLocaleDateString() : '?'
        const end = range.end ? new Date(range.end).toLocaleDateString() : '?'
        return `${start} - ${end}`
      }
      return String(value)
    case 'checkbox':
      return value ? 'Yes' : 'No'
    case 'multiselect':
      return Array.isArray(value) ? value.join(', ') : String(value)
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value)
    case 'json':
      return typeof value === 'object' ? JSON.stringify(value).slice(0, 50) + '...' : String(value)
    case 'relation':
    case 'sync':
      if (related && related.length > 0) return related.map(r => r.display_value || `#${r.id}`).join(', ')
      if (Array.isArray(value)) return value.map(v => `#${v}`).join(', ')
      return value ? `#${value}` : '—'
    default:
      return String(value)
  }
}

const renderCell = (value: unknown, type: string, related?: RelatedInfo[]) => {
  const formatted = formatCellValue(value, type, related)
  switch (type) {
    case 'checkbox':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
          {formatted}
        </span>
      )
    case 'color':
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-gray-200 dark:border-gray-700" style={{ backgroundColor: String(value) || '#ccc' }} />
          <span>{formatted}</span>
        </div>
      )
    case 'url':
      return value ? (
        <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[200px] block">
          {formatted}
        </a>
      ) : '—'
    case 'relation':
    case 'sync':
      if (!value || (Array.isArray(value) && value.length === 0)) return '—'
      return (
        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {formatted}
        </span>
      )
    default:
      return <span className="truncate max-w-[200px] block">{formatted}</span>
  }
}

// ─── Inline cell editor ───────────────────────────────────────────────────────

interface InlineCellEditorProps {
  field: CustomField
  value: unknown
  onChange: (val: unknown) => void
}

function InlineCellEditor({ field, value, onChange }: InlineCellEditorProps) {
  const base = 'w-full px-2 py-1 text-sm border border-blue-400 rounded bg-white dark:bg-[#18181B] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500'

  switch (field.type) {
    case 'number':
      return (
        <input
          type="number"
          value={value as number ?? ''}
          onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className={base}
          autoFocus
        />
      )
    case 'date':
      return (
        <input
          type="date"
          value={value as string ?? ''}
          onChange={e => onChange(e.target.value)}
          className={base}
          autoFocus
        />
      )
    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={e => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          autoFocus
        />
      )
    case 'select': {
      const opts = Array.isArray(field.options) ? field.options as { value: string; label: string }[] : []
      return (
        <select value={value as string ?? ''} onChange={e => onChange(e.target.value)} className={base} autoFocus>
          <option value="">—</option>
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )
    }
    case 'textarea':
      return (
        <textarea
          value={value as string ?? ''}
          onChange={e => onChange(e.target.value)}
          rows={2}
          className={`${base} resize-none`}
          autoFocus
        />
      )
    case 'email':
      return <input type="email" value={value as string ?? ''} onChange={e => onChange(e.target.value)} className={base} autoFocus />
    case 'phone':
      return <input type="tel" value={value as string ?? ''} onChange={e => onChange(e.target.value)} className={base} autoFocus />
    case 'url':
      return <input type="url" value={value as string ?? ''} onChange={e => onChange(e.target.value)} className={base} autoFocus />
    case 'color':
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={value as string ?? '#000000'} onChange={e => onChange(e.target.value)} className="h-7 w-10 rounded border border-blue-400 cursor-pointer" autoFocus />
          <span className="text-xs text-gray-500 dark:text-gray-400">{value as string ?? ''}</span>
        </div>
      )
    case 'multiselect': {
      const opts = Array.isArray(field.options) ? field.options as { value: string; label: string }[] : []
      const selected = Array.isArray(value) ? value as string[] : []
      return (
        <div className="flex flex-wrap gap-1">
          {opts.map(o => (
            <label key={o.value} className="inline-flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={e => {
                  const next = e.target.checked ? [...selected, o.value] : selected.filter(v => v !== o.value)
                  onChange(next)
                }}
                className="rounded border-gray-300 text-blue-600"
              />
              {o.label}
            </label>
          ))}
        </div>
      )
    }
    // relation / sync / json / richtext / file / daterange — use text fallback for inline
    default:
      return (
        <input
          type="text"
          value={value as string ?? ''}
          onChange={e => onChange(e.target.value)}
          className={base}
          autoFocus
        />
      )
  }
}

// ─── Inline new/edit row ───────────────────────────────────────────────────────

interface InlineRowProps {
  fields: CustomField[]
  initialData?: Record<string, unknown>
  recordId?: number
  onSave: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  isSaving: boolean
}

function InlineRow({ fields, initialData = {}, recordId, onSave, onCancel, isSaving }: InlineRowProps) {
  const [data, setData] = useState<Record<string, unknown>>(initialData)
  const listFields = fields.filter(f => f.show_in_list !== false).slice(0, 6)

  const handleChange = (name: string, val: unknown) => {
    setData(prev => ({ ...prev, [name]: val }))
  }

  return (
    <tr className="bg-blue-50/60 dark:bg-blue-900/10 border-b-2 border-blue-400 dark:border-blue-600">
      <td className="px-4 py-2 text-gray-400 text-sm">{recordId ?? '—'}</td>
      {listFields.map(field => (
        <td key={field.name} className="px-2 py-1.5">
          <InlineCellEditor
            field={field}
            value={data[field.name]}
            onChange={val => handleChange(field.name, val)}
          />
        </td>
      ))}
      <td className="px-4 py-2">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => onSave(data)}
            disabled={isSaving}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
            title="Save (Enter)"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Save
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Cancel (Esc)"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DynamicListPage() {
  const { tableName } = useParams<{ tableName: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { records, total, totalPages, page, currentTable, isLoading, isSubmitting, error } = useAppSelector(
    (s) => s.dynamicData
  )

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc') // desc = newest first, asc = oldest first

  // Inline mode state
  const [showNewRow, setShowNewRow] = useState(false)
  const [editingRowId, setEditingRowId] = useState<number | null>(null)

  useEffect(() => {
    if (tableName) {
      dispatch(fetchDynamicRecords({ tableName, page: currentPage, limit: 20, search: search || undefined }))
    }
    return () => { dispatch(clearDynamicData()) }
  }, [dispatch, tableName, currentPage, search])

  // Apply sort order to records
  const sortedRecords = [...records].sort((a, b) => {
    if (sortOrder === 'desc') {
      return b.id - a.id // newest first (default)
    } else {
      return a.id - b.id // oldest first
    }
  })

  // Keyboard shortcut: Escape to cancel new row
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNewRow(false)
        setEditingRowId(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const entryMode = currentTable?.entry_mode ?? 'inline'
  const listFields = currentTable?.fields?.filter((f) => f.show_in_list !== false).slice(0, 6) || []
  const displayName = currentTable?.display_name || tableName

  // ── Add record handler (mode-aware) ───────────────────────────────────────

  const handleNewRecord = () => {
    if (entryMode === 'form') {
      navigate(`/custom/${tableName}/form`)
    } else {
      setShowNewRow(true)
      setEditingRowId(null)
    }
  }

  // ── Save new inline record ─────────────────────────────────────────────────

  const handleInlineSave = async (data: Record<string, unknown>) => {
    if (!tableName) return
    const result = await dispatch(createDynamicRecord({ tableName, data }))
    if (createDynamicRecord.fulfilled.match(result)) {
      dispatch(showSuccessToast('Record Created', `New ${displayName} record has been created.`))
      setShowNewRow(false)
      dispatch(fetchDynamicRecords({ tableName, page: currentPage, limit: 20, search: search || undefined }))
    } else {
      dispatch(showErrorToast('Creation Failed', 'Failed to create the record.'))
    }
  }

  // ── Save edited inline record ──────────────────────────────────────────────

  const handleInlineUpdate = async (id: number, data: Record<string, unknown>) => {
    if (!tableName) return
    const result = await dispatch(updateDynamicRecord({ tableName, id, data }))
    if (updateDynamicRecord.fulfilled.match(result)) {
      dispatch(showSuccessToast('Record Updated', `${displayName} record #${id} has been updated.`))
      setEditingRowId(null)
    } else {
      dispatch(showErrorToast('Update Failed', 'Failed to update the record.'))
    }
  }

  // ── Edit click (mode-aware) ────────────────────────────────────────────────

  const handleEdit = (id: number) => {
    if (entryMode === 'form') {
      navigate(`/custom/${tableName}/form/${id}`)
    } else {
      setShowNewRow(false)
      setEditingRowId(id)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this record?')) return
    if (tableName) {
      const result = await dispatch(deleteDynamicRecord({ tableName, id }))
      if (deleteDynamicRecord.fulfilled.match(result)) {
        dispatch(showSuccessToast('Record Deleted', `${displayName} record #${id} has been deleted.`))
      } else {
        dispatch(showErrorToast('Delete Failed', 'Failed to delete the record.'))
      }
    }
  }

  if (!tableName) {
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">No table specified</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/tables')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {displayName}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">{total} total records</p>
              {/* Entry mode badge */}
              {currentTable && (
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  entryMode === 'inline'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                }`}>
                  {entryMode === 'inline' ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                      </svg>
                      Inline mode
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Form mode
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleNewRecord}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Record
        </button>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          title={sortOrder === 'desc' ? 'Showing newest first. Click to show oldest first.' : 'Showing oldest first. Click to show newest first.'}
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Inline mode helper tip */}
      {entryMode === 'inline' && !showNewRow && !isLoading && currentTable && (
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <CornerDownLeft className="h-3.5 w-3.5" />
          Click <span className="font-medium text-blue-600 dark:text-blue-400">New Record</span> to add an editable row directly in the table. Click the pencil icon to edit any row inline.
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#1F1F23] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : !currentTable ? (
          <div className="text-center py-16">
            <Database className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Table not found</p>
          </div>
        ) : records.length === 0 && !showNewRow ? (
          <div className="text-center py-16">
            <Database className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No records found.</p>
            <button
              onClick={handleNewRecord}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Create your first record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#18181B]">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">#</th>
                  {listFields.map((field) => (
                    <th key={field.name} className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {/* ── Inline new-record row at top ── */}
                {showNewRow && entryMode === 'inline' && (
                  <InlineRow
                    fields={listFields}
                    onSave={handleInlineSave}
                    onCancel={() => setShowNewRow(false)}
                    isSaving={isSubmitting}
                  />
                )}

                {sortedRecords.map((rec) => {
                  const isEditing = editingRowId === rec.id && entryMode === 'inline'

                  if (isEditing) {
                    return (
                      <InlineRow
                        key={rec.id}
                        fields={listFields}
                        initialData={rec.data || {}}
                        recordId={rec.id}
                        onSave={(data) => handleInlineUpdate(rec.id, data)}
                        onCancel={() => setEditingRowId(null)}
                        isSaving={isSubmitting}
                      />
                    )
                  }

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${editingRowId === rec.id ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                    >
                      <td className="px-4 py-3 text-gray-400">{rec.id}</td>
                      {listFields.map((field) => (
                        <td key={field.name} className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {renderCell(rec.data?.[field.name], field.type, rec._related?.[field.name])}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(rec.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            title={entryMode === 'inline' ? 'Edit inline' : 'Edit in form'}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rec.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
