import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/api'
import type { CustomTable, CustomField } from './customTablesSlice'

// ─── Types ────────────────────────────────────────────────────────────────────

// Related record info returned by API for relation fields
export interface RelatedInfo {
  id: number
  display_value: string
  data: Record<string, unknown>
  _notFound?: boolean
}

export interface DynamicRecord {
  id: number
  table_id: number
  data: Record<string, unknown>
  created_by: string | null
  created_at?: string
  updated_at?: string
  _related?: Record<string, RelatedInfo[]>  // Enriched relation data
}

export interface DynamicDataResponse {
  records: DynamicRecord[]
  total: number
  page: number
  totalPages: number
  table: {
    id: number
    name: string
    display_name: string
    entry_mode: 'inline' | 'form'
    fields: CustomField[]
  }
}

export interface SingleRecordResponse {
  record: DynamicRecord
  table: {
    id: number
    name: string
    display_name: string
    entry_mode: 'inline' | 'form'
    fields: CustomField[]
  }
}

interface DynamicDataState {
  currentTableName: string | null
  currentTable: Pick<CustomTable, 'id' | 'name' | 'display_name' | 'entry_mode'> & { fields: CustomField[] } | null
  records: DynamicRecord[]
  selectedRecord: DynamicRecord | null
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchDynamicRecords = createAsyncThunk<
  DynamicDataResponse,
  { tableName: string; page?: number; limit?: number; search?: string },
  { rejectValue: string }
>('dynamicData/fetchAll', async ({ tableName, ...params }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/custom-data/${tableName}`, { params })
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch records')
  }
})

export const fetchDynamicRecordById = createAsyncThunk<
  SingleRecordResponse,
  { tableName: string; id: number },
  { rejectValue: string }
>('dynamicData/fetchById', async ({ tableName, id }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/custom-data/${tableName}/${id}`)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch record')
  }
})

export const createDynamicRecord = createAsyncThunk<
  DynamicRecord,
  { tableName: string; data: Record<string, unknown> },
  { rejectValue: string }
>('dynamicData/create', async ({ tableName, data: recordData }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/custom-data/${tableName}`, { data: recordData })
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to create record')
  }
})

export const updateDynamicRecord = createAsyncThunk<
  DynamicRecord,
  { tableName: string; id: number; data: Record<string, unknown> },
  { rejectValue: string }
>('dynamicData/update', async ({ tableName, id, data: recordData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/custom-data/${tableName}/${id}`, { data: recordData })
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to update record')
  }
})

export const deleteDynamicRecord = createAsyncThunk<
  number,
  { tableName: string; id: number },
  { rejectValue: string }
>('dynamicData/delete', async ({ tableName, id }, { rejectWithValue }) => {
  try {
    await api.delete(`/custom-data/${tableName}/${id}`)
    return id
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to delete record')
  }
})

export const bulkDeleteDynamicRecords = createAsyncThunk<
  number[],
  { tableName: string; ids: number[] },
  { rejectValue: string }
>('dynamicData/bulkDelete', async ({ tableName, ids }, { rejectWithValue }) => {
  try {
    await api.delete(`/custom-data/${tableName}/bulk`, { data: { ids } })
    return ids
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to delete records')
  }
})

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState: DynamicDataState = {
  currentTableName: null,
  currentTable: null,
  records: [],
  selectedRecord: null,
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  isSubmitting: false,
  error: null,
}

const dynamicDataSlice = createSlice({
  name: 'dynamicData',
  initialState,
  reducers: {
    clearSelectedRecord(state) {
      state.selectedRecord = null
    },
    clearError(state) {
      state.error = null
    },
    clearDynamicData(state) {
      state.currentTableName = null
      state.currentTable = null
      state.records = []
      state.selectedRecord = null
      state.total = 0
      state.page = 1
      state.totalPages = 1
    },
  },
  extraReducers: (builder) => {
    // Fetch all records
    builder
      .addCase(fetchDynamicRecords.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDynamicRecords.fulfilled, (state, action: PayloadAction<DynamicDataResponse>) => {
        state.isLoading = false
        state.records = action.payload.records
        state.total = action.payload.total
        state.page = action.payload.page
        state.totalPages = action.payload.totalPages
        state.currentTable = action.payload.table
        state.currentTableName = action.payload.table.name
      })
      .addCase(fetchDynamicRecords.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'Failed to fetch records'
      })

    // Fetch single record
    builder
      .addCase(fetchDynamicRecordById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDynamicRecordById.fulfilled, (state, action: PayloadAction<SingleRecordResponse>) => {
        state.isLoading = false
        state.selectedRecord = action.payload.record
        state.currentTable = action.payload.table
        state.currentTableName = action.payload.table.name
      })
      .addCase(fetchDynamicRecordById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'Failed to fetch record'
      })

    // Create record
    builder
      .addCase(createDynamicRecord.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(createDynamicRecord.fulfilled, (state, action: PayloadAction<DynamicRecord>) => {
        state.isSubmitting = false
        state.records.unshift(action.payload)
        state.total += 1
      })
      .addCase(createDynamicRecord.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to create record'
      })

    // Update record
    builder
      .addCase(updateDynamicRecord.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(updateDynamicRecord.fulfilled, (state, action: PayloadAction<DynamicRecord>) => {
        state.isSubmitting = false
        const idx = state.records.findIndex((r) => r.id === action.payload.id)
        if (idx !== -1) state.records[idx] = action.payload
        if (state.selectedRecord?.id === action.payload.id) {
          state.selectedRecord = action.payload
        }
      })
      .addCase(updateDynamicRecord.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to update record'
      })

    // Delete record
    builder
      .addCase(deleteDynamicRecord.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(deleteDynamicRecord.fulfilled, (state, action: PayloadAction<number>) => {
        state.isSubmitting = false
        state.records = state.records.filter((r) => r.id !== action.payload)
        state.total -= 1
      })
      .addCase(deleteDynamicRecord.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to delete record'
      })

    // Bulk delete records
    builder
      .addCase(bulkDeleteDynamicRecords.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(bulkDeleteDynamicRecords.fulfilled, (state, action: PayloadAction<number[]>) => {
        state.isSubmitting = false
        state.records = state.records.filter((r) => !action.payload.includes(r.id))
        state.total -= action.payload.length
      })
      .addCase(bulkDeleteDynamicRecords.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to delete records'
      })
  },
})

export const { clearSelectedRecord, clearError, clearDynamicData } = dynamicDataSlice.actions
export default dynamicDataSlice.reducer
