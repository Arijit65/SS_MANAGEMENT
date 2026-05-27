import { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Filter,
  Columns,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
} from 'lucide-react'
import type {
  AccessRule,
  RuleType,
  RowFilterType,
  RowCondition,
  AccessLevel,
} from '../../store/slices/authSlice'
import api from '../../services/api'

interface TableField {
  name: string
  displayName: string
  fieldType: string
}

interface AccessRuleEditorProps {
  tableType: 'system' | 'custom'
  tableName: string
  accessLevel: AccessLevel
  rules: AccessRule[]
  onChange: (accessLevel: AccessLevel, rules: AccessRule[]) => void
  onClose: () => void
}

const OPERATORS = [
  { value: '=', label: 'Equals' },
  { value: '!=', label: 'Not Equals' },
  { value: '>', label: 'Greater Than' },
  { value: '<', label: 'Less Than' },
  { value: '>=', label: 'Greater Than or Equal' },
  { value: '<=', label: 'Less Than or Equal' },
  { value: 'IN', label: 'In List' },
  { value: 'NOT IN', label: 'Not In List' },
  { value: 'LIKE', label: 'Contains' },
  { value: 'ILIKE', label: 'Contains (Case Insensitive)' },
]

export default function AccessRuleEditor({
  tableType,
  tableName,
  accessLevel,
  rules,
  onChange,
  onClose,
}: AccessRuleEditorProps) {
  const [localAccessLevel, setLocalAccessLevel] = useState<AccessLevel>(accessLevel)
  const [localRules, setLocalRules] = useState<AccessRule[]>(rules)
  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set([0]))
  const [fields, setFields] = useState<TableField[]>([])
  const [isLoadingFields, setIsLoadingFields] = useState(false)

  // Fetch table fields when component mounts
  useEffect(() => {
    const fetchFields = async () => {
      setIsLoadingFields(true)
      try {
        const { data } = await api.get('/admin/table-fields', {
          params: { tableType, tableName },
        })
        setFields(data.data.fields || [])
      } catch (err) {
        console.error('Failed to fetch table fields:', err)
      } finally {
        setIsLoadingFields(false)
      }
    }
    fetchFields()
  }, [tableType, tableName])

  const addRule = (type: RuleType) => {
    const newRule: AccessRule = {
      rule_type: type,
      is_active: true,
      ...(type === 'row'
        ? { row_filter_type: 'specific_ids' as RowFilterType, row_ids: [] }
        : { allowed_columns: [] }),
    }
    setLocalRules([...localRules, newRule])
    setExpandedRules(new Set([...expandedRules, localRules.length]))
  }

  const removeRule = (index: number) => {
    setLocalRules(localRules.filter((_, i) => i !== index))
    const newExpanded = new Set(expandedRules)
    newExpanded.delete(index)
    setExpandedRules(newExpanded)
  }

  const updateRule = (index: number, updates: Partial<AccessRule>) => {
    setLocalRules(
      localRules.map((rule, i) => (i === index ? { ...rule, ...updates } : rule))
    )
  }

  const toggleRuleExpanded = (index: number) => {
    const newExpanded = new Set(expandedRules)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRules(newExpanded)
  }

  const handleSave = () => {
    onChange(localAccessLevel, localRules)
    onClose()
  }

  const renderRowFilterConfig = (rule: AccessRule, index: number) => {
    const filterType = rule.row_filter_type || 'specific_ids'

    return (
      <div className="space-y-3">
        {/* Filter Type Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Filter Type
          </label>
          <select
            value={filterType}
            onChange={(e) =>
              updateRule(index, {
                row_filter_type: e.target.value as RowFilterType,
                row_ids: e.target.value === 'specific_ids' ? [] : undefined,
                row_condition: e.target.value === 'condition' ? { field: '', operator: '=', value: '' } : undefined,
              })
            }
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#27272A] text-gray-900 dark:text-white"
          >
            <option value="specific_ids">Specific Record IDs</option>
            <option value="condition">Filter Condition</option>
            <option value="created_by">Created By User</option>
          </select>
        </div>

        {/* Specific IDs */}
        {filterType === 'specific_ids' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Record IDs (comma-separated)
            </label>
            <input
              type="text"
              value={rule.row_ids?.join(', ') || ''}
              onChange={(e) => {
                const ids = e.target.value
                  .split(',')
                  .map((s) => parseInt(s.trim(), 10))
                  .filter((n) => !isNaN(n))
                updateRule(index, { row_ids: ids })
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#27272A] text-gray-900 dark:text-white"
              placeholder="1, 2, 3, ..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the specific record IDs the user can access.
            </p>
          </div>
        )}

        {/* Condition */}
        {filterType === 'condition' && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Field
                </label>
                <select
                  value={rule.row_condition?.field || ''}
                  onChange={(e) =>
                    updateRule(index, {
                      row_condition: { ...rule.row_condition, field: e.target.value } as RowCondition,
                    })
                  }
                  className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#27272A] text-gray-900 dark:text-white"
                >
                  <option value="">Select field...</option>
                  {fields.map((field) => (
                    <option key={field.name} value={field.name}>
                      {field.displayName || field.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Operator
                </label>
                <select
                  value={rule.row_condition?.operator || '='}
                  onChange={(e) =>
                    updateRule(index, {
                      row_condition: { ...rule.row_condition, operator: e.target.value as RowCondition['operator'] } as RowCondition,
                    })
                  }
                  className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#27272A] text-gray-900 dark:text-white"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={String(rule.row_condition?.value || '')}
                  onChange={(e) =>
                    updateRule(index, {
                      row_condition: { ...rule.row_condition, value: e.target.value } as RowCondition,
                    })
                  }
                  className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#27272A] text-gray-900 dark:text-white"
                  placeholder="Value..."
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`special-${index}`}
                checked={rule.row_condition?.special === 'current_user'}
                onChange={(e) =>
                  updateRule(index, {
                    row_condition: {
                      ...rule.row_condition,
                      special: e.target.checked ? 'current_user' : undefined,
                    } as RowCondition,
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`special-${index}`} className="text-xs text-gray-600 dark:text-gray-400">
                Use current user's ID as value (for user-specific filtering)
              </label>
            </div>
          </div>
        )}

        {/* Created By */}
        {filterType === 'created_by' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              User will only see records they created.
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderColumnConfig = (rule: AccessRule, index: number) => {
    const selectedColumns = rule.allowed_columns || []

    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Allowed Columns
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Select which columns the user can see. Unselected columns will be hidden.
          </p>
          {isLoadingFields ? (
            <div className="text-sm text-gray-500">Loading fields...</div>
          ) : fields.length === 0 ? (
            <div className="text-sm text-gray-500">No fields available</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
              {fields.map((field) => (
                <label
                  key={field.name}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(field.name)}
                    onChange={(e) => {
                      const newColumns = e.target.checked
                        ? [...selectedColumns, field.name]
                        : selectedColumns.filter((c) => c !== field.name)
                      updateRule(index, { allowed_columns: newColumns })
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {field.displayName || field.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateRule(index, { allowed_columns: fields.map((f) => f.name) })}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={() => updateRule(index, { allowed_columns: [] })}
            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
          >
            Clear All
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-[#1F1F23] rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configure Access Rules
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Table: <span className="font-medium">{tableName}</span>
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Access Level Toggle */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Access Level
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accessLevel"
                  value="full"
                  checked={localAccessLevel === 'full'}
                  onChange={() => setLocalAccessLevel('full')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Full Access
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accessLevel"
                  value="restricted"
                  checked={localAccessLevel === 'restricted'}
                  onChange={() => setLocalAccessLevel('restricted')}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Restricted Access
                </span>
              </label>
            </div>
            {localAccessLevel === 'restricted' && (
              <div className="mt-2 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Restricted access is <strong>view-only</strong>. User cannot create, edit, or delete records.
                </span>
              </div>
            )}
          </div>

          {/* Rules Section */}
          {localAccessLevel === 'restricted' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Access Rules
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addRule('row')}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <Filter className="h-3 w-3" />
                    Add Row Filter
                  </button>
                  <button
                    type="button"
                    onClick={() => addRule('column')}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                  >
                    <Columns className="h-3 w-3" />
                    Add Column Filter
                  </button>
                </div>
              </div>

              {localRules.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  No access rules configured. User will have view-only access to all rows and columns.
                  <br />
                  <span className="text-xs">Add row or column filters to restrict what the user can see.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {localRules.map((rule, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg overflow-hidden ${
                        rule.rule_type === 'row'
                          ? 'border-blue-200 dark:border-blue-800'
                          : 'border-purple-200 dark:border-purple-800'
                      }`}
                    >
                      {/* Rule Header */}
                      <div
                        className={`flex items-center justify-between px-4 py-2 cursor-pointer ${
                          rule.rule_type === 'row'
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'bg-purple-50 dark:bg-purple-900/20'
                        }`}
                        onClick={() => toggleRuleExpanded(index)}
                      >
                        <div className="flex items-center gap-2">
                          {rule.rule_type === 'row' ? (
                            <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Columns className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          )}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {rule.rule_type === 'row' ? 'Row Filter' : 'Column Filter'}
                          </span>
                          {rule.description && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              - {rule.description}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={rule.is_active}
                              onChange={(e) => updateRule(index, { is_active: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-xs text-gray-500">Active</span>
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeRule(index)
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {expandedRules.has(index) ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Rule Body */}
                      {expandedRules.has(index) && (
                        <div className="px-4 py-3 bg-white dark:bg-[#1F1F23]">
                          {/* Description */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Description (optional)
                            </label>
                            <input
                              type="text"
                              value={rule.description || ''}
                              onChange={(e) => updateRule(index, { description: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#27272A] text-gray-900 dark:text-white"
                              placeholder="e.g., Only view assigned records"
                            />
                          </div>

                          {/* Rule-specific config */}
                          {rule.rule_type === 'row'
                            ? renderRowFilterConfig(rule, index)
                            : renderColumnConfig(rule, index)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Rules Info */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>
                  • <strong>Row filters</strong> combine with OR logic - user can access a record if ANY row filter matches.
                </p>
                <p>
                  • <strong>Column filters</strong> combine with AND logic - only columns allowed by ALL column filters are visible.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Check className="h-4 w-4" />
            Save Rules
          </button>
        </div>
      </div>
    </div>
  )
}
