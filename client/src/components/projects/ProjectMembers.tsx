import { useState } from "react"
import { useAppSelector, useAppDispatch } from "../../store/hooks"
import { addMember, updateMember, removeMember, type MemberRole, type PermissionLevel } from "../../store/slices/projectSlice"
import { showSuccessToast, showErrorToast } from "../../store/slices/toastSlice"
import {
  Plus,
  Crown,
  Shield,
  User,
  Eye,
  MoreHorizontal,
  Trash2,
  Settings,
  Mail,
  X,
  Check,
} from "lucide-react"

interface ProjectMembersProps {
  projectId: string
}

const ROLE_ICONS: Record<MemberRole, React.ReactNode> = {
  owner: <Crown className="h-4 w-4 text-yellow-500" />,
  manager: <Shield className="h-4 w-4 text-blue-500" />,
  member: <User className="h-4 w-4 text-gray-500" />,
  viewer: <Eye className="h-4 w-4 text-gray-400" />,
}

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  manager: "Manager",
  member: "Member",
  viewer: "Viewer",
}

const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  view_only: "View Only",
  edit_tasks: "Edit Tasks",
  manage_project: "Manage Project",
  full_admin: "Full Admin",
}

export default function ProjectMembers({ projectId }: ProjectMembersProps) {
  const dispatch = useAppDispatch()
  const { members, membersLoading } = useAppSelector((state) => state.projects)
  const { user } = useAppSelector((state) => state.auth)
  const { users } = useAppSelector((state) => state.users)

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedRole, setSelectedRole] = useState<MemberRole>("member")
  const [selectedPermission, setSelectedPermission] = useState<PermissionLevel>("edit_tasks")

  const handleAddMember = async () => {
    if (!selectedUserId) {
      dispatch(showErrorToast("Please select a user"))
      return
    }

    try {
      await dispatch(
        addMember({
          projectId,
          userId: selectedUserId,
          role: selectedRole,
          permissionLevel: selectedPermission,
        })
      ).unwrap()
      dispatch(showSuccessToast("Member added successfully"))
      setIsAddMemberOpen(false)
      setSelectedUserId("")
      setSelectedRole("member")
      setSelectedPermission("edit_tasks")
    } catch (error) {
      dispatch(showErrorToast("Failed to add member"))
    }
  }

  const handleUpdateRole = async (userId: string, role: MemberRole) => {
    try {
      await dispatch(
        updateMember({
          projectId,
          userId,
          role,
        })
      ).unwrap()
      dispatch(showSuccessToast("Role updated"))
    } catch (error) {
      dispatch(showErrorToast("Failed to update role"))
    }
    setOpenDropdown(null)
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return
    try {
      await dispatch(removeMember({ projectId, userId })).unwrap()
      dispatch(showSuccessToast("Member removed"))
    } catch (error) {
      dispatch(showErrorToast("Failed to remove member"))
    }
    setOpenDropdown(null)
  }

  const canManageMembers = user?.role === "admin" || members.some(
    m => m.userId === user?.id && (m.role === "owner" || m.canManageMembers)
  )

  // Get users not already members
  const availableUsers = users?.filter(
    u => !members.some(m => m.userId === u.id)
  ) || []

  if (membersLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-[#0F0F12] rounded-lg border border-gray-200 dark:border-[#1F1F23] animate-pulse">
            <div className="w-10 h-10 bg-gray-200 dark:bg-[#2A2A2E] rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-[#2A2A2E] rounded w-1/3" />
              <div className="h-3 bg-gray-200 dark:bg-[#2A2A2E] rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{members.length} members</span>
        {canManageMembers && (
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="px-3 py-1.5 text-sm text-[#1DA1F2] hover:bg-[#1DA1F2]/10 rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-[#0F0F12] rounded-lg border border-gray-200 dark:border-[#1F1F23] hover:border-[#1DA1F2]/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1DA1F2] text-white font-medium flex items-center justify-center">
                {member.user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {member.user.fullName}
                  </span>
                  {ROLE_ICONS[member.role]}
                  {member.userId === user?.id && (
                    <span className="px-1.5 py-0.5 text-xs bg-[#1DA1F2]/10 text-[#1DA1F2] rounded">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">{member.user.email}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">{PERMISSION_LABELS[member.permissionLevel]}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {canManageMembers && member.role !== "owner" && (
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === member.id ? null : member.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openDropdown === member.id && (
                  <div className="absolute right-0 z-10 mt-1 w-48 bg-white dark:bg-[#1F1F23] rounded-lg shadow-lg border border-gray-200 dark:border-[#2A2A2E] py-1">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                      Change Role
                    </div>
                    {(["manager", "member", "viewer"] as MemberRole[]).map((role) => (
                      <button
                        key={role}
                        onClick={() => handleUpdateRole(member.userId, role)}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2A2A2E] ${
                          member.role === role
                            ? "text-[#1DA1F2] font-medium"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {ROLE_ICONS[role]}
                        {ROLE_LABELS[role]}
                        {member.role === role && <Check className="h-4 w-4 ml-auto" />}
                      </button>
                    ))}
                    <div className="border-t border-gray-200 dark:border-[#2A2A2E] my-1" />
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsAddMemberOpen(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-[#0F0F12] rounded-xl shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#1F1F23]">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Team Member
                </h2>
                <button
                  onClick={() => setIsAddMemberOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {/* User Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select User
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                  >
                    <option value="">Choose a user...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                {/* Permission Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Permission Level
                  </label>
                  <select
                    value={selectedPermission}
                    onChange={(e) => setSelectedPermission(e.target.value as PermissionLevel)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                  >
                    <option value="view_only">View Only</option>
                    <option value="edit_tasks">Edit Tasks</option>
                    <option value="manage_project">Manage Project</option>
                    <option value="full_admin">Full Admin</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#1F1F23]">
                  <button
                    onClick={() => setIsAddMemberOpen(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMember}
                    className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1890D8] transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div className="fixed inset-0 z-0" onClick={() => setOpenDropdown(null)} />
      )}
    </div>
  )
}
