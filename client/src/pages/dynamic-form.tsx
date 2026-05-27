import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  fetchDynamicRecordById,
  createDynamicRecord,
  updateDynamicRecord,
  clearSelectedRecord,
} from '../store/slices/dynamicDataSlice'
import { fetchCustomTableByName } from '../store/slices/customTablesSlice'
import { showSuccessToast, showErrorToast } from '../store/slices/toastSlice'
import { ArrowLeft, Loader2, Check } from 'lucide-react'
import FieldRenderer from '../components/custom-tables/field-renderer'
import type { CustomField } from '../store/slices/customTablesSlice'

export default function DynamicFormPage() {
  const { tableName, id } = useParams<{ tableName: string; id?: string }>()
  const isEdit = Boolean(id)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { currentTable, selectedRecord, isLoading, isSubmitting, error } = useAppSelector(
    (s) => s.dynamicData
  )
  const { selectedTable: tableDefinition } = useAppSelector((s) => s.customTables)

  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [success, setSuccess] = useState('')

  // Load table definition
  useEffect(() => {
    if (tableName) {
      dispatch(fetchCustomTableByName(tableName))
    }
  }, [dispatch, tableName])

  // Load record if editing
  useEffect(() => {
    if (isEdit && id && tableName) {
      dispatch(fetchDynamicRecordById({ tableName, id: Number(id) }))
    }
    return () => {
      dispatch(clearSelectedRecord())
    }
  }, [dispatch, id, isEdit, tableName])

  // Get fields from either source
  const fields = tableDefinition?.fields || currentTable?.fields || []

  // Populate form with record data when editing
  useEffect(() => {
    if (isEdit && selectedRecord) {
      setFormData(selectedRecord.data || {})
    } else if (!isEdit) {
      // Set default values for new records
      const defaults: Record<string, unknown> = {}
      fields.forEach((field) => {
        if (field.default_value !== null && field.default_value !== undefined) {
          if (field.type === 'number') {
            defaults[field.name] = Number(field.default_value) || 0
          } else if (field.type === 'checkbox') {
            defaults[field.name] = field.default_value === 'true'
          } else {
            defaults[field.name] = field.default_value
          }
        }
      })
      setFormData(defaults)
    }
  }, [isEdit, selectedRecord, fields])

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')

    if (!tableName) return

    const displayName = tableDefinition?.display_name || currentTable?.display_name || tableName

    try {
      if (isEdit && id) {
        await dispatch(
          updateDynamicRecord({
            tableName,
            id: Number(id),
            data: formData,
          })
        ).unwrap()
        setSuccess('Record updated successfully!')
        dispatch(showSuccessToast('Record Updated', `${displayName} record #${id} has been updated.`))
      } else {
        await dispatch(
          createDynamicRecord({
            tableName,
            data: formData,
          })
        ).unwrap()
        setSuccess('Record created successfully!')
        dispatch(showSuccessToast('Record Created', `New ${displayName} record has been created.`))
        // Clear form after creation
        setFormData({})
      }

      setTimeout(() => {
        navigate(`/custom/${tableName}/list`)
      }, 1000)
    } catch (err) {
      dispatch(showErrorToast(
        isEdit ? 'Update Failed' : 'Creation Failed',
        `Failed to ${isEdit ? 'update' : 'create'} the record.`
      ))
    }
  }

  const displayName = tableDefinition?.display_name || currentTable?.display_name || tableName

  if (isLoading && !fields.length) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/custom/${tableName}/list`)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? `Edit ${displayName}` : `New ${displayName}`}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEdit ? 'Update the record details below' : 'Fill in the details to create a new record'}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-[#1F1F23] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-6">
            {[...fields]
              .sort((a, b) => (a.field_order || 0) - (b.field_order || 0))
              .map((field) => (
                <FieldRenderer
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  onChange={(value) => handleFieldChange(field.name, value)}
                  tableId={tableDefinition?.id || currentTable?.id}
                />
              ))}

            {fields.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No fields defined for this table. Please add fields in the table settings.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(`/custom/${tableName}/list`)}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || fields.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>{isEdit ? 'Save Changes' : 'Create Record'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
