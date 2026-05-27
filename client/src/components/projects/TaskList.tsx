import { useAppSelector } from "../../store/hooks"
import { type Task } from "../../store/slices/projectSlice"
import { format } from "date-fns"
import {
  Plus,
  Calendar,
  User,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react"

interface TaskListProps {
  projectId: string
  onCreateTask: () => void
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  medium: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
}

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-600",
  todo: "bg-blue-100 text-blue-600",
  in_progress: "bg-yellow-100 text-yellow-600",
  review: "bg-purple-100 text-purple-600",
  done: "bg-green-100 text-green-600",
}

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
}

export default function TaskList({ projectId, onCreateTask }: TaskListProps) {
  const { tasks, tasksLoading } = useAppSelector((state) => state.projects)

  if (tasksLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white dark:bg-[#0F0F12] p-4 rounded-lg border border-gray-200 dark:border-[#1F1F23] animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-gray-200 dark:bg-[#2A2A2E] rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-[#2A2A2E] rounded w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-[#2A2A2E] rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-[#1F1F23] rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tasks yet</h3>
        <p className="text-gray-500 mt-1">Create your first task to get started</p>
        <button
          onClick={onCreateTask}
          className="mt-4 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1890D8] transition-colors text-sm font-medium inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      </div>
    )
  }

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== "done"
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-500">{tasks.length} tasks</span>
        <button
          onClick={onCreateTask}
          className="px-3 py-1.5 text-sm text-[#1DA1F2] hover:bg-[#1DA1F2]/10 rounded-lg transition-colors flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* Task List */}
      <div className="border border-gray-200 dark:border-[#1F1F23] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#1F1F23] text-left text-sm">
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Task</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-28">Status</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-24">Priority</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-32">Assignee</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-28">Due Date</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="border-t border-gray-200 dark:border-[#1F1F23] hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.status === "done"}
                      readOnly
                      className="rounded border-gray-300 text-[#1DA1F2] focus:ring-[#1DA1F2]"
                    />
                    <div>
                      <p className={`font-medium text-gray-900 dark:text-white ${
                        task.status === "done" ? "line-through text-gray-400" : ""
                      }`}>
                        {task.title}
                      </p>
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {task.labels.slice(0, 2).map((label) => (
                            <span key={label} className="px-1.5 py-0.5 text-xs rounded bg-[#1DA1F2]/10 text-[#1DA1F2]">
                              {label}
                            </span>
                          ))}
                          {task.labels.length > 2 && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-[#2A2A2E] text-gray-500">
                              +{task.labels.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1DA1F2] text-white text-xs font-medium flex items-center justify-center">
                        {task.assignee.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                        {task.assignee.fullName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Unassigned
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {task.dueDate ? (
                    <span className={`text-sm flex items-center gap-1 ${
                      isOverdue(task.dueDate, task.status)
                        ? "text-red-500"
                        : "text-gray-600 dark:text-gray-400"
                    }`}>
                      {isOverdue(task.dueDate, task.status) && <AlertCircle className="h-3 w-3" />}
                      {format(new Date(task.dueDate), "MMM d")}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">No date</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
