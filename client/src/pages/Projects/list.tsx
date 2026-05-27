import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { fetchProjects, createProject, updateProject, deleteProject, type ProjectStatus, type ProjectPriority } from "../../store/slices/projectSlice"
import { showSuccessToast, showErrorToast } from "../../store/slices/toastSlice"
import ProjectTable from "../../components/projects/ProjectTable"
import {
  Plus,
  LayoutGrid,
  LayoutList,
  Search,
  SlidersHorizontal,
  X,
  Calendar,
  Users,
  Briefcase,
  ArrowLeft,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

export default function ProjectListPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { projects, loading, pagination } = useAppSelector((state) => state.projects)
  const { user } = useAppSelector((state) => state.auth)

  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("")
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | "">("")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    client: "",
    status: "planning" as ProjectStatus,
    priority: "medium" as ProjectPriority,
    deadline: "",
    color: "#1DA1F2",
  })

  useEffect(() => {
    dispatch(fetchProjects({
      page: 1,
      limit: 20,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
    }))
  }, [dispatch, searchQuery, statusFilter, priorityFilter])

  const handleCreate = async () => {
    if (!newProject.name.trim()) {
      dispatch(showErrorToast("Project name is required"))
      return
    }

    try {
      const result = await dispatch(createProject(newProject)).unwrap()
      dispatch(showSuccessToast("Project created successfully"))
      setIsCreateModalOpen(false)
      setNewProject({
        name: "",
        description: "",
        client: "",
        status: "planning",
        priority: "medium",
        deadline: "",
        color: "#1DA1F2",
      })
      navigate(`/projects/${result.id}`)
    } catch (error) {
      dispatch(showErrorToast("Failed to create project"))
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("")
    setPriorityFilter("")
  }

  const hasFilters = searchQuery || statusFilter || priorityFilter

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0C]">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F0F12] border-b border-gray-200 dark:border-[#1F1F23]">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/projects"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
              <p className="text-sm text-gray-500">Manage and track all your projects</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                />
              </div>

              {/* Filters Button */}
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={`px-3 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
                  hasFilters
                    ? "border-[#1DA1F2] text-[#1DA1F2] bg-[#1DA1F2]/5"
                    : "border-gray-200 dark:border-[#1F1F23] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#2A2A2E]"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasFilters && (
                  <span className="px-1.5 py-0.5 text-xs bg-[#1DA1F2] text-white rounded-full">
                    {[searchQuery, statusFilter, priorityFilter].filter(Boolean).length}
                  </span>
                )}
              </button>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center border border-gray-200 dark:border-[#1F1F23] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 ${
                    viewMode === "table"
                      ? "bg-[#1DA1F2] text-white"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1F1F23]"
                  }`}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-[#1DA1F2] text-white"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1F1F23]"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>

              {/* Create Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1890D8] transition-colors flex items-center gap-2 font-medium"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {isFiltersOpen && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-[#1F1F23] rounded-lg flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "")}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#2A2A2E] rounded-lg bg-white dark:bg-[#0F0F12] text-gray-900 dark:text-white"
                >
                  <option value="">All statuses</option>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as ProjectPriority | "")}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#2A2A2E] rounded-lg bg-white dark:bg-[#0F0F12] text-gray-900 dark:text-white"
                >
                  <option value="">All priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === "table" ? (
          <ProjectTable />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="bg-white dark:bg-[#0F0F12] p-4 rounded-xl border border-gray-200 dark:border-[#1F1F23] hover:shadow-lg hover:border-[#1DA1F2]/30 transition-all group"
              >
                {/* Color Bar */}
                <div
                  className="w-full h-1 rounded-full mb-4"
                  style={{ backgroundColor: project.color || "#1DA1F2" }}
                />
                
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#1DA1F2] transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      project.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : project.status === "completed"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : project.status === "on_hold"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {project.status.replace("_", " ")}
                  </span>
                </div>

                {/* Client */}
                {project.client && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Briefcase className="h-4 w-4" />
                    {project.client}
                  </div>
                )}

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-[#1F1F23] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1DA1F2] rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 dark:border-[#1F1F23]">
                  {project.deadline ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(project.deadline).toLocaleDateString()}
                    </div>
                  ) : (
                    <span>No deadline</span>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {project.memberCount || 0}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsCreateModalOpen(false)} />
            <div className="relative w-full max-w-lg bg-white dark:bg-[#0F0F12] rounded-xl shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#1F1F23]">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create New Project
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Enter project name..."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                  />
                </div>

                {/* Client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client
                  </label>
                  <input
                    type="text"
                    value={newProject.client}
                    onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                    placeholder="Enter client name..."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Describe the project..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20 resize-none"
                  />
                </div>

                {/* Status & Priority Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={newProject.priority}
                      onChange={(e) => setNewProject({ ...newProject, priority: e.target.value as ProjectPriority })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Deadline & Color Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={newProject.deadline}
                      onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newProject.color}
                        onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
                        className="h-10 w-10 rounded-lg cursor-pointer border border-gray-200 dark:border-[#1F1F23]"
                      />
                      <span className="text-sm text-gray-500">{newProject.color}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#1F1F23]">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1890D8] transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
