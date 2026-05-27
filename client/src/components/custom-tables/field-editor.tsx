import { useState } from 'react'
import { Plus, Trash2, Link2, RefreshCw } from 'lucide-react'
import type { 
  FieldType, 
  CustomFieldFormData, 
  FieldOption, 
  RelationConfig, 
  CustomTable,
  RelationType 
} from '../../store/slices/customTablesSlice'

interface FieldEditorProps {
  field: CustomFieldFormData & { tempId?: string }
  fieldTypes: { value: FieldType; label: string; description: string }[]
  availableTables?: CustomTable[]
  onChange: (updates: Partial<CustomFieldFormData>) => void
}

// Helper to check if options is a RelationConfig
const isRelationConfig = (options: FieldOption[] | RelationConfig | undefined): options is RelationConfig => {
  return options !== undefined && !Array.isArray(options) && 'target_table_id' in options
}

export default function FieldEditor({ field, fieldTypes, availableTables = [], onChange }: FieldEditorProps) {
  const [newOptionLabel, setNewOptionLabel] = useState('')
  const [newOptionValue, setNewOptionValue] = useState('')

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return
    const value = newOptionValue.trim() || newOptionLabel.trim().toLowerCase().replace(/\s+/g, '_')
    const currentOptions = (field.options || []) as FieldOption[]
    onChange({
      options: [...currentOptions, { value, label: newOptionLabel.trim() }],
    })
    setNewOptionLabel('')
    setNewOptionValue('')
  }

  const handleRemoveOption = (index: number) => {
    const currentOptions = (field.options || []) as FieldOption[]
    onChange({
      options: currentOptions.filter((_, i) => i !== index),
    })
  }

  const needsOptions = field.type === 'select' || field.type === 'multiselect'
  const isRelationField = field.type === 'relation' || field.type === 'sync'

  // Get relation config from options
  const relationConfig: RelationConfig = isRelationConfig(field.options) 
    ? field.options 
    : { target_table_id: 0 }

  // Get selected target table fields
  const selectedTargetTable = availableTables.find(t => t.id === relationConfig.target_table_id)
  const targetTableFields = selectedTargetTable?.fields || []

  // Display fields should exclude relation/sync types (show text, number, etc.)
  const displayFieldOptions = targetTableFields.filter(f => f.type !== 'relation' && f.type !== 'sync')
  
  // Target sync fields should only be relation/sync types
  const syncFieldOptions = targetTableFields.filter(f => f.type === 'relation' || f.type === 'sync')

  const handleRelationConfigChange = (updates: Partial<RelationConfig>) => {
    onChange({
      options: {
        ...relationConfig,
        ...updates,
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Field Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="e.g., Client Name"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Field Name (key) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={field.name}
            onChange={(e) =>
              onChange({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
            }
            placeholder="e.g., client_name"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Field Type */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Field Type
        </label>
        <select
          value={field.type}
          onChange={(e) => {
            const newType = e.target.value as FieldType
            onChange({ type: newType })
            // Initialize relation config when switching to relation type
            if (newType === 'relation' || newType === 'sync') {
              onChange({ 
                type: newType,
                options: { 
                  target_table_id: 0,
                  relation_type: newType === 'sync' ? 'bidirectional_sync' : 'lookup',
                  allow_multiple: false,
                } 
              })
            }
          }}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {fieldTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} - {t.description}
            </option>
          ))}
        </select>
      </div>

      {/* Relation Configuration */}
      {isRelationField && (
        <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-medium">
            {field.type === 'relation' ? <Link2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            {field.type === 'relation' ? 'Relation Configuration' : 'Sync Configuration'}
          </div>

          {/* Warning if no tables available */}
          {availableTables.length === 0 && (
            <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
              No tables available for relation. Create other tables first to link to them.
            </div>
          )}

          {/* Target Table */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Target Table <span className="text-red-500">*</span>
            </label>
            <select
              value={relationConfig.target_table_id || 0}
              onChange={(e) => handleRelationConfigChange({ 
                target_table_id: parseInt(e.target.value),
                target_table_name: availableTables.find(t => t.id === parseInt(e.target.value))?.name,
                display_field: undefined, // Reset when table changes
                target_field: undefined, // Reset sync field when table changes
              })}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select a table...</option>
              {availableTables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.display_name} ({table.name})
                </option>
              ))}
            </select>
          </div>

          {/* Display Field */}
          {selectedTargetTable && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Display Field
              </label>
              <select
                value={relationConfig.display_field || ''}
                onChange={(e) => handleRelationConfigChange({ display_field: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Auto (ID or first text field)</option>
                {displayFieldOptions.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.label} ({f.name})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Field to show in dropdown when selecting related records
              </p>
            </div>
          )}

          {/* Relation Type (for sync fields) */}
          {field.type === 'sync' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Sync Type
              </label>
              <select
                value={relationConfig.relation_type || 'bidirectional_sync'}
                onChange={(e) => handleRelationConfigChange({ relation_type: e.target.value as RelationType })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="one_way_sync">One-way Sync (this → target)</option>
                <option value="bidirectional_sync">Bidirectional Sync</option>
              </select>
            </div>
          )}

          {/* Target Field for Sync */}
          {field.type === 'sync' && selectedTargetTable && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Target Sync Field
              </label>
              {syncFieldOptions.length === 0 ? (
                <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                  No relation/sync fields exist in the target table. Add a Relation or Sync field to "{selectedTargetTable.display_name}" first to enable bidirectional sync.
                </div>
              ) : (
                <>
                  <select
                    value={relationConfig.target_field || ''}
                    onChange={(e) => handleRelationConfigChange({ target_field: e.target.value || undefined })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select field in target table...</option>
                    {syncFieldOptions.map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.label} ({f.name})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Field in target table to sync back-references to
                  </p>
                </>
              )}
            </div>
          )}

          {/* Allow Multiple */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`allow-multiple-${field.name}`}
              checked={relationConfig.allow_multiple || false}
              onChange={(e) => handleRelationConfigChange({ allow_multiple: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={`allow-multiple-${field.name}`} className="text-sm text-gray-700 dark:text-gray-300">
              Allow selecting multiple records
            </label>
          </div>

          {/* Sync Options */}
          {field.type === 'sync' && (
            <div className="space-y-2 pt-2 border-t border-blue-200 dark:border-blue-700">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Sync When:</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={relationConfig.sync_on_create !== false}
                    onChange={(e) => handleRelationConfigChange({ sync_on_create: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Create</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={relationConfig.sync_on_update !== false}
                    onChange={(e) => handleRelationConfigChange({ sync_on_update: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Update</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={relationConfig.sync_on_delete || false}
                    onChange={(e) => handleRelationConfigChange({ sync_on_delete: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Delete</span>
                </label>
              </div>
            </div>
          )}

          {/* Cascade Delete Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`cascade-delete-${field.name}`}
              checked={relationConfig.cascade_delete || false}
              onChange={(e) => handleRelationConfigChange({ cascade_delete: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor={`cascade-delete-${field.name}`} className="text-sm text-gray-700 dark:text-gray-300">
              Cascade delete (delete related records)
            </label>
          </div>
        </div>
      )}

      {/* Options for select/multiselect */}
      {needsOptions && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Options
          </label>
          <div className="space-y-2 mb-3">
            {((field.options || []) as FieldOption[]).map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => {
                    const newOptions = [...((field.options || []) as FieldOption[])]
                    newOptions[index] = { ...option, label: e.target.value }
                    onChange({ options: newOptions })
                  }}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Label"
                />
                <input
                  type="text"
                  value={option.value}
                  onChange={(e) => {
                    const newOptions = [...((field.options || []) as FieldOption[])]
                    newOptions[index] = { ...option, value: e.target.value }
                    onChange({ options: newOptions })
                  }}
                  className="w-32 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Value"
                />
                <button
                  onClick={() => handleRemoveOption(index)}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newOptionLabel}
              onChange={(e) => setNewOptionLabel(e.target.value)}
              placeholder="New option label"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
            />
            <input
              type="text"
              value={newOptionValue}
              onChange={(e) => setNewOptionValue(e.target.value)}
              placeholder="Value (auto)"
              className="w-32 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
            />
            <button
              onClick={handleAddOption}
              className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Placeholder (not for relation fields) */}
      {!isRelationField && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Placeholder
          </label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onChange({ placeholder: e.target.value || undefined })}
            placeholder="e.g., Enter client name..."
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Default Value (not for relation fields) */}
      {!isRelationField && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Default Value
          </label>
          <input
            type="text"
            value={field.default_value || ''}
            onChange={(e) => onChange({ default_value: e.target.value || undefined })}
            placeholder="Optional default value"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Toggles */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.is_required || false}
            onChange={(e) => onChange({ is_required: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.is_searchable || false}
            onChange={(e) => onChange({ is_searchable: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Searchable</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.show_in_list !== false}
            onChange={(e) => onChange({ show_in_list: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show in List</span>
        </label>
      </div>
    </div>
  )
}
