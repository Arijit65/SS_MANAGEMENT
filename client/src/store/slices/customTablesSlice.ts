import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'url'
  | 'file'
  | 'richtext'
  | 'multiselect'
  | 'daterange'
  | 'color'
  | 'json'
  | 'relation'  // One-way lookup to another table
  | 'sync'       // Bidirectional sync between tables

export type RelationType = 'lookup' | 'one_way_sync' | 'bidirectional_sync'

export interface FieldOption {
  value: string
  label: string
}

// Relation field configuration (stored in options for relation/sync fields)
export interface RelationConfig {
  target_table_id: number
  target_table_name?: string
  display_field?: string
  value_field?: string
  allow_multiple?: boolean
  relation_type?: RelationType
  target_field?: string  // For bidirectional sync
  cascade_delete?: boolean
  sync_on_create?: boolean
  sync_on_update?: boolean
  sync_on_delete?: boolean
}

// Relation info from backend (includes resolved table/field info)
export interface FieldRelation {
  id: number
  source_field_id: number
  source_table_id: number
  target_table_id: number
  target_field_id: number | null
  display_field_id: number | null
  relation_type: RelationType
  allow_multiple: boolean
  cascade_delete: boolean
  sync_on_create: boolean
  sync_on_update: boolean
  sync_on_delete: boolean
  targetTable?: {
    id: number
    name: string
    display_name: string
  }
  displayField?: {
    id: number
    name: string
    label: string
  }
}

// Related record data returned by API
export interface RelatedRecordInfo {
  id: number
  display_value: string
  data: Record<string, unknown>
  _notFound?: boolean
}

export interface CustomField {
  id: number
  table_id: number
  name: string
  label: string
  type: FieldType
  options: FieldOption[] | RelationConfig | null
  is_required: boolean
  is_searchable: boolean
  show_in_list: boolean
  field_order: number
  placeholder: string | null
  default_value: string | null
  validation: Record<string, unknown> | null
  relation?: FieldRelation | null  // Populated for relation/sync fields
  created_at?: string
  updated_at?: string
}

export interface CustomTable {
  id: number
  name: string
  display_name: string
  description: string | null
  icon: string
  is_active: boolean
  is_archived: boolean
  archived_at: string | null
  created_by: string | null
  entry_mode: 'inline' | 'form'  // How records are added/edited
  fields: CustomField[]
  field_count?: number
  record_count?: number
  created_at?: string
  updated_at?: string
}

export interface CustomTableFormData {
  name: string
  display_name: string
  description?: string
  icon?: string
  entry_mode?: 'inline' | 'form'
  fields?: Omit<CustomField, 'id' | 'table_id' | 'created_at' | 'updated_at'>[]
}

export interface CustomFieldFormData {
  name: string
  label: string
  type: FieldType
  options?: FieldOption[] | RelationConfig
  is_required?: boolean
  is_searchable?: boolean
  show_in_list?: boolean
  field_order?: number
  placeholder?: string
  default_value?: string
  validation?: Record<string, unknown>
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchCustomTables = createAsyncThunk<
  CustomTable[],
  { include_archived?: boolean } | void,
  { rejectValue: string }
>('customTables/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/custom-tables', { params })
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch tables')
  }
})

export const fetchCustomTableById = createAsyncThunk<
  CustomTable,
  number,
  { rejectValue: string }
>('customTables/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/custom-tables/${id}`)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch table')
  }
})

export const fetchCustomTableByName = createAsyncThunk<
  CustomTable,
  string,
  { rejectValue: string }
>('customTables/fetchByName', async (name, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/custom-tables/by-name/${name}`)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch table')
  }
})

export const createCustomTable = createAsyncThunk<
  CustomTable,
  CustomTableFormData,
  { rejectValue: string }
>('customTables/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/custom-tables', payload)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to create table')
  }
})

export const updateCustomTable = createAsyncThunk<
  CustomTable,
  { id: number; payload: Partial<CustomTableFormData> },
  { rejectValue: string }
>('customTables/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/custom-tables/${id}`, payload)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to update table')
  }
})

export const archiveCustomTable = createAsyncThunk<
  CustomTable,
  number,
  { rejectValue: string }
>('customTables/archive', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/custom-tables/${id}/archive`)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to archive table')
  }
})

export const restoreCustomTable = createAsyncThunk<
  CustomTable,
  number,
  { rejectValue: string }
>('customTables/restore', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/custom-tables/${id}/restore`)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to restore table')
  }
})

export const deleteCustomTable = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('customTables/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/custom-tables/${id}`)
    return id
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to delete table')
  }
})

// PATCH /custom-tables/:id - update only settings (entry_mode, icon, etc.) without touching fields
export const updateTableSettings = createAsyncThunk<
  CustomTable,
  { id: number; entry_mode?: 'inline' | 'form'; icon?: string; display_name?: string; description?: string },
  { rejectValue: string }
>('customTables/updateSettings', async ({ id, ...settings }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/custom-tables/${id}`, settings)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to update table settings')
  }
})

// Field management thunks
export const addCustomField = createAsyncThunk<
  CustomField,
  { tableId: number; field: CustomFieldFormData },
  { rejectValue: string }
>('customTables/addField', async ({ tableId, field }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/custom-tables/${tableId}/fields`, field)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to add field')
  }
})

export const updateCustomField = createAsyncThunk<
  CustomField,
  { tableId: number; fieldId: number; field: Partial<CustomFieldFormData> },
  { rejectValue: string }
>('customTables/updateField', async ({ tableId, fieldId, field }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/custom-tables/${tableId}/fields/${fieldId}`, field)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to update field')
  }
})

export const deleteCustomField = createAsyncThunk<
  { tableId: number; fieldId: number },
  { tableId: number; fieldId: number },
  { rejectValue: string }
>('customTables/deleteField', async ({ tableId, fieldId }, { rejectWithValue }) => {
  try {
    await api.delete(`/custom-tables/${tableId}/fields/${fieldId}`)
    return { tableId, fieldId }
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to delete field')
  }
})

export const reorderCustomFields = createAsyncThunk<
  CustomField[],
  { tableId: number; field_orders: { id: number; field_order: number }[] },
  { rejectValue: string }
>('customTables/reorderFields', async ({ tableId, field_orders }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/custom-tables/${tableId}/fields/reorder`, { field_orders })
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to reorder fields')
  }
})

// ─── Relation API Thunks ──────────────────────────────────────────────────────

export interface RelationOptionsResponse {
  options: Array<{
    id: number
    value: number
    label: string
    data: Record<string, unknown>
  }>
  target_table: {
    id: number
    name: string
    display_name: string
  }
  display_field: string
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

export const fetchRelationOptions = createAsyncThunk<
  RelationOptionsResponse,
  { tableId: number; fieldId: number; search?: string; limit?: number; offset?: number },
  { rejectValue: string }
>('customTables/fetchRelationOptions', async ({ tableId, fieldId, search, limit, offset }, { rejectWithValue }) => {
  try {
    const params: Record<string, string | number> = {}
    if (search) params.search = search
    if (limit) params.limit = limit
    if (offset) params.offset = offset
    
    const { data } = await api.get(`/custom-tables/${tableId}/fields/${fieldId}/relation-options`, { params })
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch relation options')
  }
})

export interface TableRelationsResponse {
  outgoing: FieldRelation[]
  incoming: FieldRelation[]
}

export const fetchTableRelations = createAsyncThunk<
  TableRelationsResponse,
  number,
  { rejectValue: string }
>('customTables/fetchTableRelations', async (tableId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/custom-tables/${tableId}/relations`)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch table relations')
  }
})

export const fetchTablesForRelation = createAsyncThunk<
  CustomTable[],
  void,
  { rejectValue: string }
>('customTables/fetchTablesForRelation', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/custom-tables/available-for-relation')
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch available tables')
  }
})

// ─── Slice ────────────────────────────────────────────────────────────────────

interface CustomTablesState {
  tables: CustomTable[]
  selectedTable: CustomTable | null
  availableTablesForRelation: CustomTable[]  // Tables available for creating relations
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

const initialState: CustomTablesState = {
  tables: [],
  selectedTable: null,
  availableTablesForRelation: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
}

const customTablesSlice = createSlice({
  name: 'customTables',
  initialState,
  reducers: {
    clearSelectedTable(state) {
      state.selectedTable = null
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch all tables
    builder
      .addCase(fetchCustomTables.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCustomTables.fulfilled, (state, action: PayloadAction<CustomTable[]>) => {
        state.isLoading = false
        state.tables = action.payload
      })
      .addCase(fetchCustomTables.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'Failed to fetch tables'
      })

    // Fetch table by ID
    builder
      .addCase(fetchCustomTableById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCustomTableById.fulfilled, (state, action: PayloadAction<CustomTable>) => {
        state.isLoading = false
        state.selectedTable = action.payload
      })
      .addCase(fetchCustomTableById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'Failed to fetch table'
      })

    // Fetch table by name
    builder
      .addCase(fetchCustomTableByName.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCustomTableByName.fulfilled, (state, action: PayloadAction<CustomTable>) => {
        state.isLoading = false
        state.selectedTable = action.payload
      })
      .addCase(fetchCustomTableByName.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'Failed to fetch table'
      })

    // Create table
    builder
      .addCase(createCustomTable.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(createCustomTable.fulfilled, (state, action: PayloadAction<CustomTable>) => {
        state.isSubmitting = false
        state.tables.unshift(action.payload)
      })
      .addCase(createCustomTable.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to create table'
      })

    // Update table
    builder
      .addCase(updateCustomTable.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(updateCustomTable.fulfilled, (state, action: PayloadAction<CustomTable>) => {
        state.isSubmitting = false
        const idx = state.tables.findIndex((t) => t.id === action.payload.id)
        if (idx !== -1) state.tables[idx] = { ...state.tables[idx], ...action.payload }
        if (state.selectedTable?.id === action.payload.id) {
          state.selectedTable = { ...state.selectedTable, ...action.payload }
        }
      })
      .addCase(updateCustomTable.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to update table'
      })

    // Update table settings (entry_mode, etc.)
    builder
      .addCase(updateTableSettings.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(updateTableSettings.fulfilled, (state, action: PayloadAction<CustomTable>) => {
        state.isSubmitting = false
        const idx = state.tables.findIndex((t) => t.id === action.payload.id)
        if (idx !== -1) state.tables[idx] = { ...state.tables[idx], ...action.payload }
        if (state.selectedTable?.id === action.payload.id) {
          state.selectedTable = { ...state.selectedTable, ...action.payload }
        }
      })
      .addCase(updateTableSettings.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to update table settings'
      })


    // Archive table
    builder
      .addCase(archiveCustomTable.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(archiveCustomTable.fulfilled, (state, action: PayloadAction<CustomTable>) => {
        state.isSubmitting = false
        const idx = state.tables.findIndex((t) => t.id === action.payload.id)
        if (idx !== -1) state.tables[idx] = action.payload
      })
      .addCase(archiveCustomTable.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to archive table'
      })

    // Restore table
    builder
      .addCase(restoreCustomTable.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(restoreCustomTable.fulfilled, (state, action: PayloadAction<CustomTable>) => {
        state.isSubmitting = false
        const idx = state.tables.findIndex((t) => t.id === action.payload.id)
        if (idx !== -1) state.tables[idx] = action.payload
      })
      .addCase(restoreCustomTable.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to restore table'
      })

    // Delete table
    builder
      .addCase(deleteCustomTable.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(deleteCustomTable.fulfilled, (state, action: PayloadAction<number>) => {
        state.isSubmitting = false
        state.tables = state.tables.filter((t) => t.id !== action.payload)
      })
      .addCase(deleteCustomTable.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to delete table'
      })

    // Add field
    builder
      .addCase(addCustomField.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(addCustomField.fulfilled, (state, action: PayloadAction<CustomField>) => {
        state.isSubmitting = false
        if (state.selectedTable && state.selectedTable.id === action.payload.table_id) {
          state.selectedTable.fields.push(action.payload)
        }
      })
      .addCase(addCustomField.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to add field'
      })

    // Update field
    builder
      .addCase(updateCustomField.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(updateCustomField.fulfilled, (state, action: PayloadAction<CustomField>) => {
        state.isSubmitting = false
        if (state.selectedTable && state.selectedTable.id === action.payload.table_id) {
          const idx = state.selectedTable.fields.findIndex((f) => f.id === action.payload.id)
          if (idx !== -1) state.selectedTable.fields[idx] = action.payload
        }
      })
      .addCase(updateCustomField.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to update field'
      })

    // Delete field
    builder
      .addCase(deleteCustomField.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(deleteCustomField.fulfilled, (state, action) => {
        state.isSubmitting = false
        if (state.selectedTable && state.selectedTable.id === action.payload.tableId) {
          state.selectedTable.fields = state.selectedTable.fields.filter(
            (f) => f.id !== action.payload.fieldId
          )
        }
      })
      .addCase(deleteCustomField.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to delete field'
      })

    // Reorder fields
    builder
      .addCase(reorderCustomFields.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(reorderCustomFields.fulfilled, (state, action: PayloadAction<CustomField[]>) => {
        state.isSubmitting = false
        if (state.selectedTable) {
          state.selectedTable.fields = action.payload
        }
      })
      .addCase(reorderCustomFields.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to reorder fields'
      })

    // Fetch tables for relation (available target tables)
    builder
      .addCase(fetchTablesForRelation.pending, () => {
        // Track loading state if needed
      })
      .addCase(fetchTablesForRelation.fulfilled, (state, action: PayloadAction<CustomTable[]>) => {
        state.availableTablesForRelation = action.payload
      })
      .addCase(fetchTablesForRelation.rejected, (state) => {
        state.availableTablesForRelation = []
      })
  },
})

export const { clearSelectedTable, clearError } = customTablesSlice.actions
export default customTablesSlice.reducer
