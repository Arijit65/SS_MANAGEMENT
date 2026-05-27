import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchUserById,
  createUser,
  updateUser,
  clearSelectedUser,
  fetchAvailableTables,
} from '../../store/slices/usersSlice'
import { ROLE_DISPLAY_NAMES, type UserRole, type TablePermission, type AccessLevel, type AccessRule } from '../../store/slices/authSlice'
import { showSuccessToast, showErrorToast } from '../../store/slices/toastSlice'
import AccessRuleEditor from './access-rule-editor'
import {
  X,
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Check,
  Settings2,
  Filter,
} from 'lucide-react'

interface UserFormModalProps {
  userId: string | null
  onClose: () => void
}

export default function UserFormModal({ userId, onClose }: UserFormModalProps) {
  const dispatch = useAppDispatch()
  const { selectedUser, availableTables, isSubmitting, error } = useAppSelector((s) => s.users)
  const isEditing = !!userId

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    role: 'content_writer' as UserRole,
    isActive: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [permissions, setPermissions] = useState<Record<string, TablePermission>>({})
  const [formError, setFormError] = useState('')
  const [editingAccessRules, setEditingAccessRules] = useState<{
    tableType: 'system' | 'custom'
    tableName: string
  } | null>(null)

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserById(userId))
    }
    // Ensure available tables are loaded
    dispatch(fetchAvailableTables())
    return () => {
      dispatch(clearSelectedUser())
    }
  }, [dispatch, userId])

  useEffect(() => {
    if (selectedUser && isEditing) {
      setFormData({
        fullName: selectedUser.fullName,
        email: selectedUser.email,
        mobile: selectedUser.mobile || '',
        password: '',
        role: selectedUser.role,
        isActive: selectedUser.isActive,
      })
      // Initialize permissions from user's existing permissions (including access rules)
      const permMap: Record<string, TablePermission> = {}
      selectedUser.tablePermissions?.forEach((p) => {
        permMap[`${p.tableType}-${p.tableName}`] = {
          ...p,
          accessLevel: p.accessLevel || 'full',
          accessRules: p.accessRules || [],
        }
      })
      setPermissions(permMap)
    }
  }, [selectedUser, isEditing])

  const handlePermissionChange = (
    tableType: 'system' | 'custom',
    tableName: string,
    field: keyof TablePermission,
    value: boolean
  ) => {
    const key = `${tableType}-${tableName}`
    setPermissions((prev) => {
      const existing = prev[key] || {
        tableType,
        tableName,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        accessLevel: 'full' as AccessLevel,
        accessRules: [],
      }
      
      // If turning off canView, turn off all other permissions and reset access
      if (field === 'canView' && !value) {
        return {
          ...prev,
          [key]: {
            ...existing,
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            accessLevel: 'full' as AccessLevel,
            accessRules: [],
          },
        }
      }
      
      // If turning on any other permission, ensure canView is on
      if (field !== 'canView' && value) {
        return {
          ...prev,
          [key]: {
            ...existing,
            [field]: value,
            canView: true,
          },
        }
      }

      return {
        ...prev,
        [key]: {
          ...existing,
          [field]: value,
        },
      }
    })
  }

  const handleSelectAllForTable = (tableType: 'system' | 'custom', tableName: string, selectAll: boolean) => {
    const key = `${tableType}-${tableName}`
    setPermissions((prev) => ({
      ...prev,
      [key]: {
        tableType,
        tableName,
        canView: selectAll,
        canCreate: selectAll,
        canEdit: selectAll,
        canDelete: selectAll,
        accessLevel: selectAll ? 'full' as AccessLevel : 'full' as AccessLevel,
        accessRules: selectAll ? (prev[key]?.accessRules || []) : [],
      },
    }))
  }

  const handleAccessRulesChange = (
    tableType: 'system' | 'custom',
    tableName: string,
    accessLevel: AccessLevel,
    accessRules: AccessRule[]
  ) => {
    const key = `${tableType}-${tableName}`
    setPermissions((prev) => {
      const existing = prev[key] || {
        tableType,
        tableName,
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      }
      
      // If access is restricted, disable create/edit/delete
      if (accessLevel === 'restricted') {
        return {
          ...prev,
          [key]: {
            ...existing,
            accessLevel,
            accessRules,
            canCreate: false,
            canEdit: false,
            canDelete: false,
          },
        }
      }
      
      return {
        ...prev,
        [key]: {
          ...existing,
          accessLevel,
          accessRules,
        },
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.fullName || !formData.email || !formData.role) {
      setFormError('Please fill in all required fields')
      return
    }

    if (!isEditing && !formData.password) {
      setFormError('Password is required for new users')
      return
    }

    // Convert permissions object to array, filtering out tables with no permissions
    const tablePermissions = Object.values(permissions).filter((p) => p.canView)

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      mobile: formData.mobile || undefined,
      password: formData.password || undefined,
      role: formData.role,
      isActive: formData.isActive,
      tablePermissions,
    }

    try {
      if (isEditing && userId) {
        await dispatch(updateUser({ id: userId, payload })).unwrap()
        dispatch(showSuccessToast('User Updated', `${formData.fullName}'s profile has been updated.`))
      } else {
        await dispatch(createUser(payload as Parameters<typeof createUser>[0])).unwrap()
        dispatch(showSuccessToast('User Created', `${formData.fullName} has been added successfully.`))
      }
      onClose()
    } catch (err) {
      dispatch(showErrorToast(
        isEditing ? 'Update Failed' : 'Creation Failed',
        typeof err === 'string' ? err : 'An error occurred. Please try again.'
      ))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1F1F23] rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit User' : 'Create New User'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Error Messages */}
            {(error || formError) && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
                {error || formError}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#27272A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#27272A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#27272A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password {!isEditing && <span className="text-red-500">*</span>}
                  {isEditing && <span className="text-gray-400 text-xs ml-1">(leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#27272A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    required={!isEditing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Shield className="inline h-4 w-4 mr-1" />
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#27272A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.entries(ROLE_DISPLAY_NAMES)
                  .filter(([key]) => key !== 'admin')
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                User is active and can log in
              </label>
            </div>

            {/* Table Permissions */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Table Access Permissions
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Select which tables this user can access and what actions they can perform.
              </p>

              {!availableTables || (availableTables.systemTables?.length === 0 && availableTables.customTables?.length === 0) ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No tables available yet.
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-400">
                          Table
                        </th>
                        <th className="text-center px-2 py-2 font-medium text-gray-600 dark:text-gray-400 w-16">
                          View
                        </th>
                        <th className="text-center px-2 py-2 font-medium text-gray-600 dark:text-gray-400 w-16">
                          Create
                        </th>
                        <th className="text-center px-2 py-2 font-medium text-gray-600 dark:text-gray-400 w-16">
                          Edit
                        </th>
                        <th className="text-center px-2 py-2 font-medium text-gray-600 dark:text-gray-400 w-16">
                          Delete
                        </th>
                        <th className="text-center px-2 py-2 font-medium text-gray-600 dark:text-gray-400 w-16">
                          All
                        </th>
                        <th className="text-center px-2 py-2 font-medium text-gray-600 dark:text-gray-400 w-20">
                          Access
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {/* System Tables */}
                      {availableTables?.systemTables && availableTables.systemTables.length > 0 && (
                        <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                          <td colSpan={7} className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            System Tables
                          </td>
                        </tr>
                      )}
                      {availableTables?.systemTables?.map((table) => {
                        const key = `system-${table.name}`
                        const perm = permissions[key] || {}
                        const allChecked = perm.canView && perm.canCreate && perm.canEdit && perm.canDelete
                        const isRestricted = perm.accessLevel === 'restricted'
                        const hasRules = (perm.accessRules?.length || 0) > 0
                        return (
                          <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                            <td className="px-4 py-2 text-gray-900 dark:text-white">
                              {table.displayName}
                              <span className="text-xs text-gray-400 ml-2">({table.name})</span>
                              {isRestricted && (
                                <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                                  <Filter className="h-3 w-3" />
                                  Restricted
                                </span>
                              )}
                            </td>
                            <td className="text-center px-2 py-2">
                              <input
                                type="checkbox"
                                checked={!!perm.canView}
                                onChange={(e) => handlePermissionChange('system', table.name, 'canView', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="text-center px-2 py-2">
                              <input
                                type="checkbox"
                                checked={!!perm.canCreate}
                                disabled={isRestricted}
                                onChange={(e) => handlePermissionChange('system', table.name, 'canCreate', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </td>
                            <td className="text-center px-2 py-2">
                              <input
                                type="checkbox"
                                checked={!!perm.canEdit}
                                disabled={isRestricted}
                                onChange={(e) => handlePermissionChange('system', table.name, 'canEdit', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </td>
                            <td className="text-center px-2 py-2">
                              <input
                                type="checkbox"
                                checked={!!perm.canDelete}
                                disabled={isRestricted}
                                onChange={(e) => handlePermissionChange('system', table.name, 'canDelete', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </td>
                            <td className="text-center px-2 py-2">
                              <button
                                type="button"
                                onClick={() => handleSelectAllForTable('system', table.name, !allChecked)}
                                disabled={isRestricted}
                                className={`p-1 rounded ${allChecked ? 'text-green-600' : 'text-gray-400'} hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50`}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </td>
                            <td className="text-center px-2 py-2">
                              <button
                                type="button"
                                onClick={() => setEditingAccessRules({ tableType: 'system', tableName: table.name })}
                                disabled={!perm.canView}
                                className={`p-1 rounded transition-colors disabled:opacity-30 ${
                                  hasRules
                                    ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                                title="Configure access rules"
                              >
                                <Settings2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}

                      {/* Custom Tables */}
                      {availableTables?.customTables && availableTables.customTables.length > 0 && (
                        <tr className="bg-purple-50/50 dark:bg-purple-900/10">
                          <td colSpan={7} className="px-4 py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            Custom Tables
                          </td>
                        </tr>
                      )}
                      {availableTables?.customTables?.map((table) => {
                        const key = `custom-${table.name}`
                        const perm = permissions[key] || {}
                        const allChecked = perm.canView && perm.canCreate && perm.canEdit && perm.canDelete
                        const isRestricted = perm.accessLevel === 'restricted'
                        const hasRules = (perm.accessRules?.length || 0) > 0
                        return (
                          <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                            <td className="px-4 py-2 text-gray-900 dark:text-white">
                              {table.displayName}
                              <span className="text-xs text-gray-400 ml-2">({table.name})</span>
                              {isRestricted && (
                                <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                                  <Filter className="h-3 w-3" />
                                  Restricted
                                </span>
                              )}
                            </td>
                            <td className="text-center px-2 py-2">
                              <input
                                type="checkbox"
                                checked={!!perm.canView}
                                onChange={(e) => handlePermissionChange('custom', table.name, 'canView', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                            </td>
                            <td className="text-center px-2 py-2">
                              <input
                                type="checkbox"
                                checked={!!perm.canCreate}
                                disabled={isRestricted}
                                onChange={(e) => handlePermissionChange('custom', table.name, 'canCreate', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                              />
                            </td>
                            <td className="text-center px-2 py-2">
                              <input
                                type="checkbox"
                                checked={!!perm.canEdit}
                                disabled={isRestricted}
                                onChange={(e) => handlePermissionChange('custom', table.name, 'canEdit', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                              />
                            </td>
                            <td className="text-center px-2 py-2">
                              <input
                                type="checkbox"
                                checked={!!perm.canDelete}
                                disabled={isRestricted}
                                onChange={(e) => handlePermissionChange('custom', table.name, 'canDelete', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                              />
                            </td>
                            <td className="text-center px-2 py-2">
                              <button
                                type="button"
                                onClick={() => handleSelectAllForTable('custom', table.name, !allChecked)}
                                disabled={isRestricted}
                                className={`p-1 rounded ${allChecked ? 'text-green-600' : 'text-gray-400'} hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50`}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </td>
                            <td className="text-center px-2 py-2">
                              <button
                                type="button"
                                onClick={() => setEditingAccessRules({ tableType: 'custom', tableName: table.name })}
                                disabled={!perm.canView}
                                className={`p-1 rounded transition-colors disabled:opacity-30 ${
                                  hasRules
                                    ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                                title="Configure access rules"
                              >
                                <Settings2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      {/* Access Rule Editor Modal */}
      {editingAccessRules && (
        <AccessRuleEditor
          tableType={editingAccessRules.tableType}
          tableName={editingAccessRules.tableName}
          accessLevel={permissions[`${editingAccessRules.tableType}-${editingAccessRules.tableName}`]?.accessLevel || 'full'}
          rules={permissions[`${editingAccessRules.tableType}-${editingAccessRules.tableName}`]?.accessRules || []}
          onChange={(accessLevel, rules) => {
            handleAccessRulesChange(
              editingAccessRules.tableType,
              editingAccessRules.tableName,
              accessLevel,
              rules
            )
          }}
          onClose={() => setEditingAccessRules(null)}
        />
      )}
    </div>
  )
}
