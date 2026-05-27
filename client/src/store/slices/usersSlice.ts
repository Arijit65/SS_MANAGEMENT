import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/api'
import type { UserRole, TablePermission } from './authSlice'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  fullName: string
  email: string
  mobile?: string
  role: UserRole
  isActive: boolean
  createdAt: string
  createdBy?: string
  creator?: {
    id: string
    fullName: string
  }
  tablePermissions: TablePermission[]
}

export interface AvailableTable {
  type: 'system' | 'custom'
  name: string
  displayName: string
  icon?: string
}

export interface CreateUserPayload {
  fullName: string
  email: string
  mobile?: string
  password: string
  role: UserRole
  isActive?: boolean
  tablePermissions?: TablePermission[]
}

export interface UpdateUserPayload {
  fullName?: string
  email?: string
  mobile?: string
  password?: string
  role?: UserRole
  isActive?: boolean
  tablePermissions?: TablePermission[]
}

interface UsersState {
  users: User[]
  selectedUser: User | null
  availableTables: {
    systemTables: AvailableTable[]
    customTables: AvailableTable[]
  }
  roles: UserRole[]
  roleDisplayNames: Record<string, string>
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchUsers = createAsyncThunk<
  User[],
  { search?: string; role?: string; isActive?: string } | void,
  { rejectValue: string }
>('users/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/admin/users', { params })
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch users')
  }
})

export const fetchUserById = createAsyncThunk<
  User,
  string,
  { rejectValue: string }
>('users/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/admin/users/${id}`)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch user')
  }
})

export const fetchAvailableTables = createAsyncThunk<
  { systemTables: AvailableTable[]; customTables: AvailableTable[] },
  void,
  { rejectValue: string }
>('users/fetchAvailableTables', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/admin/tables')
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch tables')
  }
})

export const fetchRoles = createAsyncThunk<
  { roles: UserRole[]; roleDisplayNames: Record<string, string> },
  void,
  { rejectValue: string }
>('users/fetchRoles', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/admin/roles')
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch roles')
  }
})

export const createUser = createAsyncThunk<
  User,
  CreateUserPayload,
  { rejectValue: string }
>('users/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/admin/users', payload)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to create user')
  }
})

export const updateUser = createAsyncThunk<
  User,
  { id: string; payload: UpdateUserPayload },
  { rejectValue: string }
>('users/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/admin/users/${id}`, payload)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to update user')
  }
})

export const deleteUser = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('users/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/admin/users/${id}`)
    return id
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to delete user')
  }
})

export const toggleUserStatus = createAsyncThunk<
  { id: string; isActive: boolean },
  string,
  { rejectValue: string }
>('users/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/admin/users/${id}/toggle-status`)
    return data.data
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Failed to toggle user status')
  }
})

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState: UsersState = {
  users: [],
  selectedUser: null,
  availableTables: {
    systemTables: [],
    customTables: [],
  },
  roles: [],
  roleDisplayNames: {},
  isLoading: false,
  isSubmitting: false,
  error: null,
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearSelectedUser(state) {
      state.selectedUser = null
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch all users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.isLoading = false
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'Failed to fetch users'
      })

    // Fetch user by ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUserById.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false
        state.selectedUser = action.payload
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'Failed to fetch user'
      })

    // Fetch available tables
    builder
      .addCase(fetchAvailableTables.fulfilled, (state, action) => {
        state.availableTables = action.payload
      })

    // Fetch roles
    builder
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload.roles
        state.roleDisplayNames = action.payload.roleDisplayNames
      })

    // Create user
    builder
      .addCase(createUser.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isSubmitting = false
        state.users.unshift(action.payload)
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to create user'
      })

    // Update user
    builder
      .addCase(updateUser.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isSubmitting = false
        const idx = state.users.findIndex((u) => u.id === action.payload.id)
        if (idx !== -1) state.users[idx] = action.payload
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to update user'
      })

    // Delete user
    builder
      .addCase(deleteUser.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.isSubmitting = false
        state.users = state.users.filter((u) => u.id !== action.payload)
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to delete user'
      })

    // Toggle user status
    builder
      .addCase(toggleUserStatus.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        state.isSubmitting = false
        const idx = state.users.findIndex((u) => u.id === action.payload.id)
        if (idx !== -1) {
          state.users[idx].isActive = action.payload.isActive
        }
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload ?? 'Failed to toggle user status'
      })
  },
})

export const { clearSelectedUser, clearError } = usersSlice.actions
export default usersSlice.reducer
