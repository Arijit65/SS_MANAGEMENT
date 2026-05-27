import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import {
  fetchProject,
  fetchTasks,
  fetchMembers,
  fetchFiles,
  fetchActivity,
  clearCurrentProject,
  createTask,
  type TaskStatus,
} from "../../store/slices/projectSlice"
import { showSuccessToast, showErrorToast } from "../../store/slices/toastSlice"
import TaskBoard from "./TaskBoard"
import TaskList from "./TaskList"
import ProjectFiles from "./ProjectFiles"
import ProjectMembers from "./ProjectMembers"
import ActivityFeed from "./ActivityFeed"
import CreateTaskModal from "./CreateTaskModal"
import {
  ArrowLeft,
  Settings,
  Users,
  FileText,
  Activity,
  Kanban,
  List,
  Calendar,
  Plus,
  Edit2,
  MoreHorizontal,
} from "lucide-react"

type TabType = "overview" | "tasks" | "files" | "members" | "activity"
type TaskViewType = "kanban" | "list"

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { currentProject, projectLoading, activities, activitiesLoading } = useAppSelector(
    (state) => state.projects
  )

  const [activeTab, setActiveTab] = useState<TabType>("tasks")
  const [taskView, setTaskView] = useState<TaskViewType>("kanban")
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>("todo")

  useEffect(() => {
    if (id) {
      dispatch(fetchProject(id))
      dispatch(fetchTasks({ projectId: id }))
      dispatch(fetchMembers(id))
      dispatch(fetchFiles({ projectId: id }))
      dispatch(fetchActivity({ projectId: id, limit: 20 }))
    }

    return () => {
      dispatch(clearCurrentProject())
    }
  }, [dispatch, id])

  const handleCreateTask = (status: TaskStatus = "todo") => {
    setDefaultTaskStatus(status)
    setIsCreateTaskOpen(true)
  }

  if (projectLoading) {
    return (
      <div className="space-y-6 w-full min-w-0">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23] animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-[#1F1F23] rounded-xl" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 dark:bg-[#1F1F23] rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-[#1F1F23] rounded w-1/2" />
            </div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23] h-96 animate-pulse" />
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-[#1F1F23] rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project not found</h2>
        <p className="text-gray-500 mt-2">The project you're looking for doesn't exist or you don't have access.</p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 mt-4 text-[#1DA1F2] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>
    )
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "tasks", label: "Tasks", icon: <Kanban className="h-4 w-4" /> },
    { id: "files", label: "Files", icon: <FileText className="h-4 w-4" /> },
    { id: "members", label: "Team", icon: <Users className="h-4 w-4" /> },
    { id: "activity", label: "Activity", icon: <Activity className="h-4 w-4" /> },
    { id: "overview", label: "Overview", icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Link
              to="/projects/list"
              className="mt-1 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1F1F23] rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: currentProject.color }}
            >
              {currentProject.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentProject.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                {currentProject.client && (
                  <span className="text-sm text-gray-500">
                    Client: {currentProject.client}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    currentProject.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : currentProject.status === "completed"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {currentProject.status}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    currentProject.priority === "urgent"
                      ? "bg-red-100 text-red-700"
                      : currentProject.priority === "high"
                      ? "bg-orange-100 text-orange-700"
                      : currentProject.priority === "medium"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {currentProject.priority}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCreateTask()}
              className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1890D8] transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>
            <Link
              to={`/projects/${id}/edit`}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1F1F23] rounded-lg transition-colors"
            >
              <Edit2 className="h-5 w-5" />
            </Link>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1F1F23] rounded-lg transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {currentProject.progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-[#1F1F23] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${currentProject.progress}%`,
                backgroundColor: currentProject.color,
              }}
            />
          </div>
        </div>

        {/* Task Stats */}
        {currentProject.taskStats && (
          <div className="flex items-center gap-4 mt-4 text-sm">
            <span className="text-gray-500">
              <span className="font-medium text-gray-900 dark:text-white">
                {currentProject.taskStats.total}
              </span>{" "}
              tasks
            </span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-green-600">
              {currentProject.taskStats.done} done
            </span>
            <span className="text-yellow-600">
              {currentProject.taskStats.in_progress} in progress
            </span>
            <span className="text-blue-600">
              {currentProject.taskStats.todo} to do
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23]">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#1F1F23] px-4">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? "border-[#1DA1F2] text-[#1DA1F2]"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Task View Toggle */}
          {activeTab === "tasks" && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1F1F23] rounded-lg p-1">
              <button
                onClick={() => setTaskView("kanban")}
                className={`p-2 rounded-lg transition-colors ${
                  taskView === "kanban"
                    ? "bg-white dark:bg-[#0F0F12] text-[#1DA1F2] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Kanban className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTaskView("list")}
                className={`p-2 rounded-lg transition-colors ${
                  taskView === "list"
                    ? "bg-white dark:bg-[#0F0F12] text-[#1DA1F2] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "tasks" && (
            taskView === "kanban" ? (
              <TaskBoard projectId={id!} onCreateTask={handleCreateTask} />
            ) : (
              <TaskList projectId={id!} onCreateTask={() => handleCreateTask()} />
            )
          )}
          {activeTab === "files" && <ProjectFiles projectId={id!} />}
          {activeTab === "members" && <ProjectMembers projectId={id!} />}
          {activeTab === "activity" && (
            <ActivityFeed activities={activities} loading={activitiesLoading} />
          )}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {currentProject.description || "No description provided"}
                </p>
              </div>
              {currentProject.deadline && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Deadline
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="h-5 w-5" />
                    {new Date(currentProject.deadline).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}
              {currentProject.tags && currentProject.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProject.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-sm rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        projectId={id!}
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        defaultStatus={defaultTaskStatus}
      />
    </div>
  )
}
