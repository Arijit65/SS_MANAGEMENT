import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchUsers,
  fetchRoles,
  fetchAvailableTables,
  deleteUser,
  toggleUserStatus,
} from '../../store/slices/usersSlice'
import { ROLE_DISPLAY_NAMES } from '../../store/slices/authSlice'
import { showSuccessToast, showErrorToast } from '../../store/slices/toastSlice'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
} from 'lucide-react'
import UserFormModal from '../../components/auth/user-form-modal'

export default function UsersPage() {
  const dispatch = useAppDispatch()
  const { users, isLoading, isSubmitting, error } = useAppSelector((s) => s.users)
  const currentUser = useAppSelector((s) => s.auth.user)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchUsers())
    dispatch(fetchRoles())
    dispatch(fetchAvailableTables())
  }, [dispatch])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = !roleFilter || user.role === roleFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleDelete = async (id: string) => {
    const userToDelete = users.find(u => u.id === id)
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    const result = await dispatch(deleteUser(id))
    if (deleteUser.fulfilled.match(result)) {
      dispatch(showSuccessToast('User Deleted', `${userToDelete?.fullName || 'User'} has been deleted.`))
    } else {
      dispatch(showErrorToast('Delete Failed', 'Failed to delete user. Please try again.'))
    }
  }

  const handleToggleStatus = async (id: string) => {
    const targetUser = users.find(u => u.id === id)
    const result = await dispatch(toggleUserStatus(id))
    if (toggleUserStatus.fulfilled.match(result)) {
      const newStatus = !targetUser?.isActive ? 'activated' : 'deactivated'
      dispatch(showSuccessToast('Status Updated', `${targetUser?.fullName || 'User'} has been ${newStatus}.`))
    } else {
      dispatch(showErrorToast('Update Failed', 'Failed to update user status.'))
    }
  }

  const handleEdit = (id: string) => {
    setEditingUserId(id)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingUserId(null)
    dispatch(fetchUsers())
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      content_writer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      coordinator: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      design_qc: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      customer_support: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      marketer: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      developer: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      graphics_designer: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    }
    return colors[role] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUserId(null)
            setModalOpen(true)
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          {Object.entries(ROLE_DISPLAY_NAMES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              statusFilter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {search || roleFilter || statusFilter !== 'all'
              ? 'No users match your filters.'
              : 'No users yet. Create one to get started!'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1F1F23] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  User
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  Contact
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  Role
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  Permissions
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </div>
                      {user.mobile && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-3.5 w-3.5" />
                          {user.mobile}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      <Shield className="h-3 w-3" />
                      {ROLE_DISPLAY_NAMES[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {user.role === 'admin' ? (
                        <span className="text-purple-600 dark:text-purple-400 font-medium">Full Access</span>
                      ) : (
                        <span>{user.tablePermissions?.length || 0} tables</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => user.role !== 'admin' && handleToggleStatus(user.id)}
                      disabled={user.role === 'admin' || isSubmitting}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        user.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                      } ${user.role === 'admin' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      {user.isActive ? (
                        <>
                          <UserCheck className="h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user.id)}
                        disabled={user.role === 'admin' && user.id !== currentUser?.id}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={user.role === 'admin' || user.id === currentUser?.id || isSubmitting}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Form Modal */}
      {modalOpen && <UserFormModal userId={editingUserId} onClose={handleModalClose} />}
    </div>
  )
}
