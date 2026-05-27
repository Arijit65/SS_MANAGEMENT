import { useState, useEffect, useCallback } from 'react'
import { Link2, RefreshCw, X, Search, Loader2 } from 'lucide-react'
import type { CustomField, RelationConfig, RelatedRecordInfo } from '../../store/slices/customTablesSlice'
import api from '../../services/api'

interface FieldRendererProps {
  field: CustomField
  value: unknown
  onChange: (value: unknown) => void
  tableId?: number  // Source table ID for fetching relation options
  relatedData?: Record<string, RelatedRecordInfo[]>  // Pre-fetched related data
}

// Helper to check if options is a RelationConfig
const isRelationConfig = (options: unknown): options is RelationConfig => {
  return options !== null && typeof options === 'object' && 'target_table_id' in options
}

export default function FieldRenderer({ field, value, onChange, tableId, relatedData }: FieldRendererProps) {
  const [jsonError, setJsonError] = useState('')
  const [relationOptions, setRelationOptions] = useState<Array<{
    id: number
    value: number
    label: string
    data: Record<string, unknown>
  }>>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const isRelationField = field.type === 'relation' || field.type === 'sync'
  const relationConfig = isRelationConfig(field.options) ? field.options : null

  // Fetch relation options
  const fetchRelationOptions = useCallback(async (search?: string) => {
    if (!isRelationField || !tableId || !field.id) return

    setIsLoadingOptions(true)
    try {
      const params: Record<string, string | number> = { limit: 50 }
      if (search) params.search = search

      const { data } = await api.get(
        `/custom-tables/${tableId}/fields/${field.id}/relation-options`,
        { params }
      )
      setRelationOptions(data.data?.options || [])
    } catch (err) {
      console.error('Failed to fetch relation options:', err)
      setRelationOptions([])
    } finally {
      setIsLoadingOptions(false)
    }
  }, [isRelationField, tableId, field.id])

  // Load options when field is opened
  useEffect(() => {
    if (isDropdownOpen && isRelationField && relationOptions.length === 0) {
      fetchRelationOptions()
    }
  }, [isDropdownOpen, isRelationField, fetchRelationOptions, relationOptions.length])

  // Debounced search
  useEffect(() => {
    if (!isDropdownOpen) return
    const timer = setTimeout(() => {
      fetchRelationOptions(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, isDropdownOpen, fetchRelationOptions])

  const baseInputClass =
    'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#18181B] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  const renderLabel = () => (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {field.label}
      {field.is_required && <span className="text-red-500 ml-1">*</span>}
      {isRelationField && (
        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
          {field.type === 'relation' ? <Link2 className="inline h-3 w-3" /> : <RefreshCw className="inline h-3 w-3" />}
        </span>
      )}
    </label>
  )

  // Get display value for a relation
  const getRelatedDisplayValue = (id: number | string): string => {
    // Check pre-fetched related data first
    const related = relatedData?.[field.name]
    if (related) {
      const item = related.find(r => r.id === id)
      if (item) return item.display_value
    }

    // Check loaded options
    const option = relationOptions.find(o => o.id === id)
    if (option) return option.label

    return `#${id}`
  }

  // Render relation field
  const renderRelationField = () => {
    const selectedValues = relationConfig?.allow_multiple
      ? (Array.isArray(value) ? (value as number[]) : [])
      : (value ? [value as number] : [])

    const handleSelect = (optionId: number) => {
      if (relationConfig?.allow_multiple) {
        if (!selectedValues.includes(optionId)) {
          onChange([...selectedValues, optionId])
        }
      } else {
        onChange(optionId)
        setIsDropdownOpen(false)
      }
      setSearchTerm('')
    }

    const handleRemove = (id: number) => {
      if (relationConfig?.allow_multiple) {
        onChange(selectedValues.filter(v => v !== id))
      } else {
        onChange(null)
      }
    }

    return (
      <div className="relative">
        {/* Selected values */}
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedValues.map(id => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
              >
                {getRelatedDisplayValue(id)}
                <button
                  type="button"
                  onClick={() => handleRemove(id)}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search/Select input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder={selectedValues.length === 0 ? (field.placeholder || 'Search or select...') : 'Add another...'}
            className={`${baseInputClass} pr-10`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoadingOptions ? (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Dropdown */}
        {isDropdownOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />

            <div className="absolute z-20 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-[#1F1F23] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
              {isLoadingOptions ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : relationOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No results found' : 'No records available'}
                </div>
              ) : (
                relationOptions
                  .filter(opt => !selectedValues.includes(opt.id))
                  .map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {option.label}
                    </button>
                  ))
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  const renderInput = () => {
    switch (field.type) {
      case 'relation':
      case 'sync':
        return renderRelationField()

      case 'text':
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || undefined}
            required={field.is_required}
            className={baseInputClass}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || undefined}
            required={field.is_required}
            rows={4}
            className={`${baseInputClass} resize-none`}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={field.placeholder || undefined}
            required={field.is_required}
            className={baseInputClass}
          />
        )

      case 'email':
        return (
          <input
            type="email"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'email@example.com'}
            required={field.is_required}
            className={baseInputClass}
          />
        )

      case 'phone':
        return (
          <input
            type="tel"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || '+1 (555) 000-0000'}
            required={field.is_required}
            className={baseInputClass}
          />
        )

      case 'date':
        return (
          <input
            type="date"
            value={(value as string)?.split('T')[0] || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
            className={baseInputClass}
          />
        )

      case 'daterange':
        const rangeValue = (value as { start?: string; end?: string }) || {}
        return (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={rangeValue.start?.split('T')[0] || ''}
              onChange={(e) => onChange({ ...rangeValue, start: e.target.value })}
              required={field.is_required}
              className={baseInputClass}
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={rangeValue.end?.split('T')[0] || ''}
              onChange={(e) => onChange({ ...rangeValue, end: e.target.value })}
              required={field.is_required}
              className={baseInputClass}
            />
          </div>
        )

      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
            className={baseInputClass}
          >
            <option value="">{field.placeholder || 'Select an option...'}</option>
            {Array.isArray(field.options) && field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? (value as string[]) : []
        const options = Array.isArray(field.options) ? field.options : []
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {selectedValues.map((v) => {
                const opt = options.find((o) => o.value === v)
                return (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                  >
                    {opt?.label || v}
                    <button
                      type="button"
                      onClick={() => onChange(selectedValues.filter((x) => x !== v))}
                      className="hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      &times;
                    </button>
                  </span>
                )
              })}
            </div>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !selectedValues.includes(e.target.value)) {
                  onChange([...selectedValues, e.target.value])
                }
              }}
              className={baseInputClass}
            >
              <option value="">Add option...</option>
              {options
                .filter((opt) => !selectedValues.includes(opt.value))
                .map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
            </select>
          </div>
        )

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {field.placeholder || 'Yes'}
            </span>
          </label>
        )

      case 'url':
        return (
          <input
            type="url"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'https://example.com'}
            required={field.is_required}
            className={baseInputClass}
          />
        )

      case 'color':
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={(value as string) || '#3b82f6'}
              onChange={(e) => onChange(e.target.value)}
              className="w-10 h-10 rounded border border-gray-200 dark:border-gray-700 cursor-pointer"
            />
            <input
              type="text"
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className={`${baseInputClass} flex-1`}
            />
          </div>
        )

      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // For now, just store the file name
                  // In a real implementation, you'd upload to Cloudinary/S3
                  onChange(file.name)
                }
              }}
              className="w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-blue-50 file:text-blue-700
                dark:file:bg-blue-900/30 dark:file:text-blue-300
                hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                cursor-pointer"
            />
            {value && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Current: {String(value)}
              </p>
            )}
          </div>
        )

      case 'richtext':
        // Simple textarea for now - can be replaced with a rich text editor
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'Enter formatted text...'}
            required={field.is_required}
            rows={6}
            className={`${baseInputClass} resize-none font-mono`}
          />
        )

      case 'json':
        const jsonValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : (value as string) || '{}'
        return (
          <div className="space-y-1">
            <textarea
              value={jsonValue}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  onChange(parsed)
                  setJsonError('')
                } catch {
                  setJsonError('Invalid JSON')
                  onChange(e.target.value)
                }
              }}
              placeholder='{"key": "value"}'
              rows={6}
              className={`${baseInputClass} resize-none font-mono text-xs ${
                jsonError ? 'border-red-500' : ''
              }`}
            />
            {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || undefined}
            className={baseInputClass}
          />
        )
    }
  }

  return (
    <div>
      {field.type !== 'checkbox' && renderLabel()}
      {renderInput()}
    </div>
  )
}
