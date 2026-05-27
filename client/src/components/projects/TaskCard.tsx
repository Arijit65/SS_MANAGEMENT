import { formatDistanceToNow } from "date-fns"
import { Calendar, MessageSquare, Paperclip, User, AlertCircle } from "lucide-react"
import type { Task } from "../../store/slices/projectSlice"

interface TaskCardProps {
  task: Task
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  medium: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
}

const TYPE_COLORS: Record<string, string> = {
  task: "border-blue-400",
  bug: "border-red-400",
  feature: "border-green-400",
  improvement: "border-purple-400",
  documentation: "border-yellow-400",
}

const isOverdue = (dueDate: string) => {
  return new Date(dueDate) < new Date()
}

export default function TaskCard({ task }: TaskCardProps) {
  const overdue = task.dueDate && task.status !== "done" && isOverdue(task.dueDate)

  return (
    <div
      className={`bg-white dark:bg-[#0F0F12] rounded-lg p-3 border-l-4 border border-gray-200 dark:border-[#2A2A2E] hover:shadow-md transition-shadow cursor-pointer group ${
        TYPE_COLORS[task.type] || "border-l-gray-400"
      }`}
    >
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((label, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2]"
            >
              {label}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-[#2A2A2E] text-gray-500">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-[#1DA1F2] transition-colors">
        {task.title}
      </h4>

      {/* Priority & Type */}
      <div className="flex items-center gap-2 mt-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {task.type}
        </span>
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${overdue ? "text-red-500" : "text-gray-500"}`}>
          {overdue && <AlertCircle className="h-3 w-3" />}
          <Calendar className="h-3 w-3" />
          <span>
            {overdue
              ? `Overdue by ${formatDistanceToNow(new Date(task.dueDate))}`
              : formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-[#2A2A2E]">
        {/* Assignee */}
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1DA1F2] text-white text-xs font-medium flex items-center justify-center">
              {task.assignee.fullName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[80px]">
              {task.assignee.fullName}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-400">
            <User className="h-4 w-4" />
            <span className="text-xs">Unassigned</span>
          </div>
        )}

        {/* Indicators */}
        <div className="flex items-center gap-2 text-gray-400">
          {task.commentCount > 0 && (
            <div className="flex items-center gap-0.5 text-xs">
              <MessageSquare className="h-3 w-3" />
              <span>{task.commentCount}</span>
            </div>
          )}
          {task.attachmentCount > 0 && (
            <div className="flex items-center gap-0.5 text-xs">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachmentCount}</span>
            </div>
          )}
          {task.checklist && task.checklist.length > 0 && (
            <div className="flex items-center gap-0.5 text-xs">
              <span>
                {task.checklist.filter((c) => c.completed).length}/{task.checklist.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
