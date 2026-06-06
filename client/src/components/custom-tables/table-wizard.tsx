import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  createCustomTable,
  fetchCustomTableById,
  updateCustomTable,
  updateCustomField,
  addCustomField,
  fetchCustomTables,
  clearSelectedTable,
  fetchTablesForRelation,
  type CustomFieldFormData,
  type FieldType,
} from '../../store/slices/customTablesSlice'
import { showSuccessToast, showErrorToast } from '../../store/slices/toastSlice'
import { X, ChevronRight, ChevronLeft, Plus, Trash2, GripVertical, Loader2, Check } from 'lucide-react'
import FieldEditor from './field-editor'

interface TableWizardProps {
  tableId?: number | null
  onClose: () => void
}

// UPDATED: Added relation and sync field types - v2.0
const FIELD_TYPES: { value: FieldType; label: string; description: string }[] = [
  { value: 'text', label: 'Text', description: 'Single line text input' },
  { value: 'textarea', label: 'Long Text', description: 'Multi-line text area' },
  { value: 'number', label: 'Number', description: 'Numeric input' },
  { value: 'email', label: 'Email', description: 'Email address' },
  { value: 'phone', label: 'Phone', description: 'Phone number' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'select', label: 'Dropdown', description: 'Single select from options' },
  { value: 'multiselect', label: 'Multi-Select', description: 'Select multiple options' },
  { value: 'checkbox', label: 'Checkbox', description: 'True/false toggle' },
  { value: 'url', label: 'URL', description: 'Website link' },
  { value: 'file', label: 'File Upload', description: 'Upload files' },
  { value: 'richtext', label: 'Rich Text', description: 'Formatted text editor' },
  { value: 'daterange', label: 'Date Range', description: 'Start and end dates' },
  { value: 'color', label: 'Color', description: 'Color picker' },
  { value: 'json', label: 'JSON', description: 'JSON data editor' },
  { value: 'relation', label: 'Relation', description: 'Link to another table (lookup)' },
  { value: 'sync', label: 'Sync', description: 'Bidirectional sync with another table' },
]

interface LocalField extends CustomFieldFormData {
  tempId: string
}

export default function TableWizard({ tableId, onClose }: TableWizardProps) {
  const dispatch = useAppDispatch()
  const { selectedTable, isSubmitting, error, availableTablesForRelation } = useAppSelector((s) => s.customTables)
  const isEditing = !!tableId

  const [step, setStep] = useState(1)
  const [tableName, setTableName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('FileText')
  const [entryMode, setEntryMode] = useState<'inline' | 'form'>('inline')
  const [fields, setFields] = useState<LocalField[]>([])
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null)
  const [formError, setFormError] = useState('')

  // Load table data when editing
  useEffect(() => {
    if (tableId) {
      dispatch(fetchCustomTableById(tableId))
    }
    return () => {
      dispatch(clearSelectedTable())
    }
  }, [dispatch, tableId])

  // Load available tables for relation fields
  useEffect(() => {
    dispatch(fetchTablesForRelation())
  }, [dispatch])

  // Populate form when table is loaded
  useEffect(() => {
    if (selectedTable && isEditing) {
      setTableName(selectedTable.name)
      setDisplayName(selectedTable.display_name)
      setDescription(selectedTable.description || '')
      setIcon(selectedTable.icon || 'FileText')
      setEntryMode((selectedTable.entry_mode as 'inline' | 'form') || 'inline')
      setFields(
        selectedTable.fields.map((f) => ({
          tempId: `existing-${f.id}`,
          name: f.name,
          label: f.label,
          type: f.type,
          options: f.options || undefined,
          is_required: f.is_required,
          is_searchable: f.is_searchable,
          show_in_list: f.show_in_list,
          field_order: f.field_order,
          placeholder: f.placeholder || undefined,
          default_value: f.default_value || undefined,
          validation: f.validation || undefined,
        }))
      )
    }
  }, [selectedTable, isEditing])

  // Auto-generate slug from display name
  useEffect(() => {
    if (!isEditing && displayName && !tableName) {
      setTableName(
        displayName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      )
    }
  }, [displayName, tableName, isEditing])

  const validateStep1 = () => {
    if (!displayName.trim()) {
      setFormError('Display name is required')
      return false
    }
    if (!tableName.trim()) {
      setFormError('Table name (slug) is required')
      return false
    }
    if (!/^[a-z0-9_-]+$/.test(tableName)) {
      setFormError('Table name must be lowercase alphanumeric with hyphens or underscores only')
      return false
    }
    setFormError('')
    return true
  }

  const validateStep2 = () => {
    if (fields.length === 0) {
      setFormError('At least one field is required')
      return false
    }
    for (const field of fields) {
      if (!field.name.trim() || !field.label.trim()) {
        setFormError('All fields must have a name and label')
        return false
      }
      if (!/^[a-z0-9_]+$/.test(field.name)) {
        setFormError(`Field "${field.label}" name must be lowercase alphanumeric with underscores`)
        return false
      }
    }
    // Check for duplicate field names
    const names = fields.map((f) => f.name)
    if (new Set(names).size !== names.length) {
      setFormError('Field names must be unique')
      return false
    }
    setFormError('')
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleBack = () => {
    setFormError('')
    setStep((s) => s - 1)
  }

  const handleAddField = () => {
    const newField: LocalField = {
      tempId: `new-${Date.now()}`,
      name: '',
      label: '',
      type: 'text',
      is_required: false,
      is_searchable: false,
      show_in_list: true,
      field_order: fields.length,
    }
    setFields([...fields, newField])
    setEditingFieldIndex(fields.length)
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
    if (editingFieldIndex === index) {
      setEditingFieldIndex(null)
    }
  }

  const handleFieldChange = (index: number, updates: Partial<LocalField>) => {
    setFields(
      fields.map((f, i) =>
        i === index
          ? {
              ...f,
              ...updates,
              // Auto-generate field name from label if not set
              name:
                updates.label && !f.name
                  ? updates.label
                      .toLowerCase()
                      .replace(/[^a-z0-9\s_]/g, '')
                      .replace(/\s+/g, '_')
                  : updates.name ?? f.name,
            }
          : f
      )
    )
  }

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return

    const tableMetadata = {
      name: tableName,
      display_name: displayName,
      description: description || undefined,
      icon,
      entry_mode: entryMode,
    }

    try {
      if (isEditing && tableId) {
        // 1. Update table metadata
        await dispatch(updateCustomTable({ id: tableId, payload: tableMetadata })).unwrap()

        // 2. Update / create each field
        for (let i = 0; i < fields.length; i++) {
          const f = fields[i]
          const fieldPayload: Partial<CustomFieldFormData> = {
            label: f.label,
            type: f.type,
            options: f.options,
            is_required: f.is_required,
            is_searchable: f.is_searchable,
            show_in_list: f.show_in_list,
            field_order: i,
            placeholder: f.placeholder,
            default_value: f.default_value,
            validation: f.validation,
          }

          if (f.tempId.startsWith('existing-')) {
            // Extract the numeric ID from 'existing-<id>'
            const fieldId = parseInt(f.tempId.replace('existing-', ''), 10)
            await dispatch(updateCustomField({ tableId, fieldId, field: fieldPayload })).unwrap()
          } else {
            // Brand-new field
            await dispatch(
              addCustomField({
                tableId,
                field: {
                  name: f.name,
                  label: f.label,
                  type: f.type,
                  options: f.options,
                  is_required: f.is_required ?? false,
                  is_searchable: f.is_searchable ?? false,
                  show_in_list: f.show_in_list ?? true,
                  field_order: i,
                  placeholder: f.placeholder,
                  default_value: f.default_value,
                  validation: f.validation,
                },
              })
            ).unwrap()
          }
        }

        // 3. Refresh the table list so the parent sees latest data
        dispatch(fetchCustomTables())
        dispatch(showSuccessToast('Table Updated', `${displayName} has been updated.`))
      } else {
        const tableData = {
          ...tableMetadata,
          fields: fields.map((f, i) => ({
            name: f.name,
            label: f.label,
            type: f.type,
            options: f.options,
            is_required: f.is_required,
            is_searchable: f.is_searchable,
            show_in_list: f.show_in_list,
            field_order: i,
            placeholder: f.placeholder,
            default_value: f.default_value,
            validation: f.validation,
          })),
        }
        await dispatch(createCustomTable(tableData)).unwrap()
        dispatch(showSuccessToast('Table Created', `${displayName} has been created successfully.`))
      }
      onClose()
    } catch (err) {
      dispatch(showErrorToast(
        isEditing ? 'Update Failed' : 'Creation Failed',
        `Failed to ${isEditing ? 'update' : 'create'} the table.`
      ))
    }
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newFields = [...fields]
      ;[newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]]
      setFields(newFields)
    } else if (direction === 'down' && index < fields.length - 1) {
      const newFields = [...fields]
      ;[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]]
      setFields(newFields)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1F1F23] rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Table' : 'Create Custom Table'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Step {step} of 3: {step === 1 ? 'Table Info' : step === 2 ? 'Define Fields' : 'Review'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s < step
                      ? 'bg-green-500 text-white'
                      : s === step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      s < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {(formError || error) && (
          <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
            {formError || error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Client Requests"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#18181B] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="e.g., client-requests"
                  disabled={isEditing}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#18181B] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will be used in URLs: /custom/{tableName || 'your-table'}/list
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description for this table..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#18181B] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#18181B] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FileText">Document</option>
                  <option value="Database">Database</option>
                  <option value="Table2">Table</option>
                  <option value="LayoutList">List</option>
                </select>
              </div>

              {/* Entry Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Record Entry Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEntryMode('inline')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      entryMode === 'inline'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${entryMode === 'inline' ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${entryMode === 'inline' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${entryMode === 'inline' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        Inline Row
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Edit directly in table</p>
                    </div>
                    {entryMode === 'inline' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryMode('form')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      entryMode === 'form'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${entryMode === 'form' ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${entryMode === 'form' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${entryMode === 'form' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        Full Form
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Opens a dedicated form page</p>
                    </div>
                    {entryMode === 'form' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  You can change this at any time from the table editor.
                </p>
              </div>
            </div>
          )}


          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add fields that will appear in your custom table.
                </p>
                <button
                  onClick={handleAddField}
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">No fields yet</p>
                  <button
                    onClick={handleAddField}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Add your first field
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.tempId}
                      className={`border rounded-lg ${
                        editingFieldIndex === index
                          ? 'border-blue-500 dark:border-blue-400'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer"
                        onClick={() => setEditingFieldIndex(editingFieldIndex === index ? null : index)}
                      >
                        <button
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab"
                          title="Drag to reorder"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {field.label || 'Untitled Field'}
                            </span>
                            {field.is_required && (
                              <span className="text-xs text-red-500">*</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type}
                            {field.name && ` • ${field.name}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              moveField(index, 'up')
                            }}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                            title="Move up"
                          >
                            <ChevronLeft className="h-4 w-4 rotate-90" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              moveField(index, 'down')
                            }}
                            disabled={index === fields.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                            title="Move down"
                          >
                            <ChevronRight className="h-4 w-4 rotate-90" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveField(index)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Remove field"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {editingFieldIndex === index && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-[#18181B]">
                          <FieldEditor
                            field={field}
                            fieldTypes={FIELD_TYPES}
                            availableTables={availableTablesForRelation}
                            onChange={(updates) => handleFieldChange(index, updates)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Table Information</h3>
                <div className="bg-gray-50 dark:bg-[#18181B] rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Display Name</span>
                    <span className="text-sm text-gray-900 dark:text-white">{displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">URL Slug</span>
                    <span className="text-sm text-gray-900 dark:text-white">/{tableName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Entry Mode</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {entryMode === 'inline' ? 'Inline Row' : 'Full Form'}
                    </span>
                  </div>
                  {description && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Description</span>
                      <span className="text-sm text-gray-900 dark:text-white text-right max-w-xs truncate">
                        {description}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fields ({fields.length})
                </h3>
                <div className="bg-gray-50 dark:bg-[#18181B] rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                  {fields.map((field, index) => (
                    <div key={field.tempId} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {field.label}
                        </span>
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          ({field.name})
                        </span>
                      </div>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        {FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={step === 1 ? onClose : handleBack}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={step === 3 ? handleSubmit : handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEditing ? 'Saving...' : 'Creating...'}
              </>
            ) : step === 3 ? (
              isEditing ? 'Save Changes' : 'Create Table'
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
