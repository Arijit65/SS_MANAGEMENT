import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 
  | 'admin'
  | 'content_writer'
  | 'coordinator'
  | 'design_qc'
  | 'customer_support'
  | 'marketer'
  | 'developer'
  | 'graphics_designer'

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Admin',
  content_writer: 'Content Writer',
  coordinator: 'Coordinator',
  design_qc: 'Design QC',
  customer_support: 'Customer Support',
  marketer: 'Marketer',
  developer: 'Developer',
  graphics_designer: 'Graphics Designer',
}

export type AccessLevel = 'full' | 'restricted'
export type RuleType = 'row' | 'column'
export type RowFilterType = 'specific_ids' | 'condition' | 'created_by'

export interface RowCondition {
  field: string
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'LIKE' | 'ILIKE'
  value: string | number | boolean | (string | number)[]
  special?: 'current_user'  // Special value that gets replaced with current user ID
}

export interface AccessRule {
  id?: number
  rule_type: RuleType
  row_filter_type?: RowFilterType
  row_ids?: number[]
  row_condition?: RowCondition
  allowed_columns?: string[]
  description?: string
  is_active: boolean
}

export interface TablePermission {
  id?: number
  tableType: 'system' | 'custom'
  tableName: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  accessLevel?: AccessLevel
  accessRules?: AccessRule[]
}

export interface AuthUser {
  id: string
  fullName: string
  email: string
  mobile?: string
  role: UserRole
  isActive: boolean
  tablePermissions: TablePermission[]
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface LoginPayload {
  email: string
  password: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadFromStorage(): Pick<AuthState, 'user' | 'token' | 'isAuthenticated'> {
  try {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      return { token, user: JSON.parse(user), isAuthenticated: true }
    }
  } catch {
    // ignore corrupt storage
  }
  return { token: null, user: null, isAuthenticated: false }
}

// Helper to check if user has permission for a table
export function hasTablePermission(
  user: AuthUser | null,
  tableName: string,
  permissionType: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' = 'canView'
): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  
  // If user has no permissions array, deny access
  if (!user.tablePermissions || user.tablePermissions.length === 0) {
    return false
  }
  
  const permission = user.tablePermissions.find(
    (p) => p.tableName === tableName
  )
  
  // If no explicit permission for this table, deny access
  if (!permission) return false
  
  return permission[permissionType] === true
}

// Helper to check if user has restricted access to a table
export function hasRestrictedAccess(
  user: AuthUser | null,
  tableName: string
): boolean {
  if (!user) return false
  if (user.role === 'admin') return false
  
  const permission = user.tablePermissions?.find(
    (p) => p.tableName === tableName
  )
  
  return permission?.accessLevel === 'restricted'
}

// Helper to get access rules for a table
export function getTableAccessRules(
  user: AuthUser | null,
  tableName: string
): AccessRule[] {
  if (!user) return []
  if (user.role === 'admin') return []
  
  const permission = user.tablePermissions?.find(
    (p) => p.tableName === tableName
  )
  
  return permission?.accessRules?.filter(r => r.is_active) || []
}

// Helper to check if user can modify data (create/edit/delete) in a table
// Restricted access users cannot modify data
export function canModifyTableData(
  user: AuthUser | null,
  tableName: string,
  action: 'canCreate' | 'canEdit' | 'canDelete'
): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  
  const permission = user.tablePermissions?.find(
    (p) => p.tableName === tableName
  )
  
  if (!permission) return false
  
  // If access level is restricted, user cannot modify data
  if (permission.accessLevel === 'restricted') return false
  
  return permission[action] === true
}

// Helper to get all accessible tables for a user
export function getAccessibleTables(user: AuthUser | null): string[] {
  if (!user) return []
  if (user.role === 'admin') return [] // Admin sees all, handled separately
  
  return user.tablePermissions
    ?.filter((p) => p.canView)
    .map((p) => p.tableName) || []
}

// Helper to check if user is admin
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin'
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk<
  { token: string; user: AuthUser },
  LoginPayload,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    return data.data as { token: string; user: AuthUser }
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    return rejectWithValue(error.response?.data?.message ?? 'Login failed')
  }
})

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  ...loadFromStorage(),
  isLoading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    clearError(state) {
      state.error = null
    },
    updateUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        localStorage.setItem('user', JSON.stringify(state.user))
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ token: string; user: AuthUser }>) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.token = action.payload.token
        state.user = action.payload.user
        localStorage.setItem('token', action.payload.token)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'Login failed'
      })
  },
})

export const { logout, clearError, updateUser } = authSlice.actions
export default authSlice.reducer
