import { useState, useEffect, useMemo, useCallback } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import {
  fetchProjects,
  updateProject,
  archiveProject,
  deleteProject,
  type Project,
  type ProjectStatus,
  type ProjectPriority,
} from "../../store/slices/projectSlice"
import { addToast } from "../../store/slices/toastSlice"
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Edit2,
  Archive,
  Trash2,
  Eye,
  RefreshCw,
  Users,
  Calendar,
  ArrowUpDown,
  Check,
  X,
} from "lucide-react"

const STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string }[] = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { value: "completed", label: "Completed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "on_hold", label: "On Hold", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
]

const PRIORITY_OPTIONS: { value: ProjectPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
]

interface EditableCell {
  projectId: string
  field: string
  value: string | number
}

export default function ProjectTable() {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { projects, projectsLoading, pagination } = useAppSelector((state) => state.projects)
  const { user } = useAppSelector((state) => state.auth)

  // Filters state
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">(
    (searchParams.get("status") as ProjectStatus) || ""
  )
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | "">(
    (searchParams.get("priority") as ProjectPriority) || ""
  )
  const [showArchived, setShowArchived] = useState(searchParams.get("archived") === "true")

  // Sorting state
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  )

  // Inline editing state
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null)
  const [editValue, setEditValue] = useState<string>("")

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Selected rows for bulk actions
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  // Fetch projects
  useEffect(() => {
    const params: Record<string, unknown> = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: 20,
      sortBy,
      sortOrder,
      archived: showArchived,
    }
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    if (priorityFilter) params.priority = priorityFilter

    dispatch(fetchProjects(params))
  }, [dispatch, search, statusFilter, priorityFilter, sortBy, sortOrder, showArchived, searchParams])

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  // Inline editing handlers
  const startEditing = (project: Project, field: string) => {
    setEditingCell({ projectId: project.id, field, value: project[field as keyof Project] as string | number })
    setEditValue(String(project[field as keyof Project] || ""))
  }

  const cancelEditing = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const saveEdit = async () => {
    if (!editingCell) return

    try {
      await dispatch(
        updateProject({
          id: editingCell.projectId,
          [editingCell.field]: editingCell.field === "progress" ? parseInt(editValue) : editValue,
        })
      ).unwrap()
      dispatch(addToast({ title: "Project updated successfully", type: "success" }))
    } catch (error) {
      dispatch(addToast({ title: "Failed to update project", type: "error" }))
    }
    cancelEditing()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit()
    if (e.key === "Escape") cancelEditing()
  }

  // Status/Priority inline edit
  const handleStatusChange = async (projectId: string, status: ProjectStatus) => {
    try {
      await dispatch(updateProject({ id: projectId, status })).unwrap()
      dispatch(addToast({ title: "Status updated", type: "success" }))
    } catch (error) {
      dispatch(addToast({ title: "Failed to update status", type: "error" }))
    }
    setOpenDropdown(null)
  }

  const handlePriorityChange = async (projectId: string, priority: ProjectPriority) => {
    try {
      await dispatch(updateProject({ id: projectId, priority })).unwrap()
      dispatch(addToast({ title: "Priority updated", type: "success" }))
    } catch (error) {
      dispatch(addToast({ title: "Failed to update priority", type: "error" }))
    }
    setOpenDropdown(null)
  }

  // Archive/Delete handlers
  const handleArchive = async (id: string, archive: boolean) => {
    try {
      await dispatch(archiveProject({ id, archive })).unwrap()
      dispatch(addToast({ title: archive ? "Project archived" : "Project restored", type: "success" }))
    } catch (error) {
      dispatch(addToast({ title: "Failed to update project", type: "error" }))
    }
    setOpenDropdown(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this project?")) return
    try {
      await dispatch(deleteProject(id)).unwrap()
      dispatch(addToast({ title: "Project deleted", type: "success" }))
    } catch (error) {
      dispatch(addToast({ title: "Failed to delete project", type: "error" }))
    }
    setOpenDropdown(null)
  }

  // Row selection
  const toggleRowSelection = (id: string) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedRows(newSelection)
  }

  const toggleAllRows = () => {
    if (selectedRows.size === projects.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(projects.map((p) => p.id)))
    }
  }

  // Render sortable header
  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-left font-semibold text-gray-700 dark:text-gray-300 hover:text-[#1DA1F2] transition-colors group"
    >
      {label}
      <ArrowUpDown
        className={`h-4 w-4 ${
          sortBy === field ? "text-[#1DA1F2]" : "text-gray-400 group-hover:text-[#1DA1F2]"
        }`}
      />
    </button>
  )

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total} projects • Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/projects/new"
            className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1890D8] transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20 focus:border-[#1DA1F2]"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters || statusFilter || priorityFilter
                ? "border-[#1DA1F2] text-[#1DA1F2] bg-[#1DA1F2]/5"
                : "border-gray-200 dark:border-[#1F1F23] text-gray-600 dark:text-gray-400 hover:border-[#1DA1F2]"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {(statusFilter || priorityFilter) && (
              <span className="px-1.5 py-0.5 text-xs bg-[#1DA1F2] text-white rounded-full">
                {(statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Archived Toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
              showArchived
                ? "border-[#1DA1F2] text-[#1DA1F2] bg-[#1DA1F2]/5"
                : "border-gray-200 dark:border-[#1F1F23] text-gray-600 dark:text-gray-400"
            }`}
          >
            <Archive className="h-4 w-4" />
            {showArchived ? "Archived" : "Active"}
          </button>
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-[#1F1F23]">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "")}
                className="appearance-none px-4 py-2 pr-8 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as ProjectPriority | "")}
                className="appearance-none px-4 py-2 pr-8 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
              >
                <option value="">All Priorities</option>
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Clear Filters */}
            {(statusFilter || priorityFilter) && (
              <button
                onClick={() => {
                  setStatusFilter("")
                  setPriorityFilter("")
                }}
                className="px-4 py-2 text-sm text-[#1DA1F2] hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#1F1F23] border-b border-gray-200 dark:border-[#2A2A2E]">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === projects.length && projects.length > 0}
                    onChange={toggleAllRows}
                    className="rounded border-gray-300 text-[#1DA1F2] focus:ring-[#1DA1F2]"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="name" label="Project Name" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="client" label="Client" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="status" label="Status" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="priority" label="Priority" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="deadline" label="Deadline" />
                </th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="progress" label="Progress" />
                </th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {projectsLoading ? (
                // Skeleton loading
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-[#1F1F23]">
                    <td className="px-4 py-3">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-[#1F1F23] rounded animate-pulse" />
                    </td>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-[#1F1F23] rounded animate-pulse w-24" />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-[#1F1F23] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-[#1F1F23] rounded-full flex items-center justify-center mb-4">
                        <Archive className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium">No projects found</p>
                      <p className="text-sm mt-1">
                        {search || statusFilter || priorityFilter
                          ? "Try adjusting your filters"
                          : "Create your first project to get started"}
                      </p>
                      {!search && !statusFilter && !priorityFilter && (
                        <Link
                          to="/projects/new"
                          className="mt-4 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1890D8] transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create Project
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project.id}
                    className={`border-b border-gray-100 dark:border-[#1F1F23] hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50 transition-colors ${
                      selectedRows.has(project.id) ? "bg-[#1DA1F2]/5" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(project.id)}
                        onChange={() => toggleRowSelection(project.id)}
                        className="rounded border-gray-300 text-[#1DA1F2] focus:ring-[#1DA1F2]"
                      />
                    </td>

                    {/* Project Name */}
                    <td className="px-4 py-3">
                      {editingCell?.projectId === project.id && editingCell.field === "name" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="px-2 py-1 border border-[#1DA1F2] rounded bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none w-full"
                          />
                          <button onClick={saveEdit} className="text-green-500 hover:text-green-600">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-500">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <Link
                          to={`/projects/${project.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span
                            className="font-medium text-gray-900 dark:text-white group-hover:text-[#1DA1F2] transition-colors cursor-pointer"
                            onDoubleClick={(e) => {
                              e.preventDefault()
                              startEditing(project, "name")
                            }}
                          >
                            {project.name}
                          </span>
                        </Link>
                      )}
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      {editingCell?.projectId === project.id && editingCell.field === "client" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="px-2 py-1 border border-[#1DA1F2] rounded bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none"
                          />
                          <button onClick={saveEdit} className="text-green-500">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={cancelEditing} className="text-gray-400">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                          onDoubleClick={() => startEditing(project, "client")}
                        >
                          {project.client || "-"}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === `status-${project.id}` ? null : `status-${project.id}`)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            STATUS_OPTIONS.find((o) => o.value === project.status)?.color
                          }`}
                        >
                          {STATUS_OPTIONS.find((o) => o.value === project.status)?.label}
                        </button>
                        {openDropdown === `status-${project.id}` && (
                          <div className="absolute z-10 mt-1 w-32 bg-white dark:bg-[#1F1F23] rounded-lg shadow-lg border border-gray-200 dark:border-[#2A2A2E] py-1">
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleStatusChange(project.id, opt.value)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2A2A2E] text-gray-700 dark:text-gray-300"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === `priority-${project.id}` ? null : `priority-${project.id}`)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            PRIORITY_OPTIONS.find((o) => o.value === project.priority)?.color
                          }`}
                        >
                          {PRIORITY_OPTIONS.find((o) => o.value === project.priority)?.label}
                        </button>
                        {openDropdown === `priority-${project.id}` && (
                          <div className="absolute z-10 mt-1 w-32 bg-white dark:bg-[#1F1F23] rounded-lg shadow-lg border border-gray-200 dark:border-[#2A2A2E] py-1">
                            {PRIORITY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handlePriorityChange(project.id, opt.value)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2A2A2E] text-gray-700 dark:text-gray-300"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Deadline */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString()
                          : "-"}
                      </span>
                    </td>

                    {/* Team */}
                    <td className="px-4 py-3">
                      <div className="flex items-center -space-x-2">
                        {project.members?.slice(0, 3).map((member) => (
                          <div
                            key={member.id}
                            className="w-7 h-7 rounded-full bg-[#1DA1F2] text-white text-xs font-medium flex items-center justify-center border-2 border-white dark:border-[#0F0F12]"
                            title={member.user.fullName}
                          >
                            {member.user.fullName.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {(project.memberCount || 0) > 3 && (
                          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-[#2A2A2E] text-gray-600 dark:text-gray-400 text-xs font-medium flex items-center justify-center border-2 border-white dark:border-[#0F0F12]">
                            +{(project.memberCount || 0) - 3}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 dark:bg-[#2A2A2E] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${project.progress}%`,
                              backgroundColor: project.color,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-10">
                          {project.progress}%
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === `actions-${project.id}` ? null : `actions-${project.id}`)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1F1F23] rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openDropdown === `actions-${project.id}` && (
                          <div className="absolute right-0 z-10 mt-1 w-48 bg-white dark:bg-[#1F1F23] rounded-lg shadow-lg border border-gray-200 dark:border-[#2A2A2E] py-1">
                            <Link
                              to={`/projects/${project.id}`}
                              className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2A2A2E] text-gray-700 dark:text-gray-300"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Link>
                            <Link
                              to={`/projects/${project.id}/edit`}
                              className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2A2A2E] text-gray-700 dark:text-gray-300"
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit Project
                            </Link>
                            <button
                              onClick={() => handleArchive(project.id, !project.isArchived)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2A2A2E] text-gray-700 dark:text-gray-300"
                            >
                              {project.isArchived ? (
                                <>
                                  <RefreshCw className="h-4 w-4" />
                                  Restore
                                </>
                              ) : (
                                <>
                                  <Archive className="h-4 w-4" />
                                  Archive
                                </>
                              )}
                            </button>
                            {user?.role === "admin" && (
                              <button
                                onClick={() => handleDelete(project.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-[#1F1F23]">
            <div className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.page - 1) })}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 border border-gray-200 dark:border-[#1F1F23] rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#1F1F23]"
              >
                Previous
              </button>
              <button
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.page + 1) })}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 border border-gray-200 dark:border-[#1F1F23] rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#1F1F23]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  )
}
