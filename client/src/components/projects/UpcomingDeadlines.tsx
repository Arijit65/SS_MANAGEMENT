import { formatDistanceToNow, format } from "date-fns"
import { Calendar, AlertTriangle } from "lucide-react"
import type { Project } from "../../store/slices/projectSlice"

interface UpcomingDeadlinesProps {
  projects: Project[]
  loading?: boolean
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    case "high":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    case "medium":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    default:
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
  }
}

const isOverdue = (deadline: string) => {
  return new Date(deadline) < new Date()
}

const isDueSoon = (deadline: string) => {
  const dueDate = new Date(deadline)
  const today = new Date()
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 3 && diffDays >= 0
}

export default function UpcomingDeadlines({ projects, loading }: UpcomingDeadlinesProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Deadlines
        </h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#1F1F23] rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-[#2A2A2E] rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-[#2A2A2E] rounded w-2/3" />
                <div className="h-3 bg-gray-200 dark:bg-[#2A2A2E] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Upcoming Deadlines
      </h3>
      
      {projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No upcoming deadlines</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isOverdue(project.deadline!)
                  ? "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
                  : isDueSoon(project.deadline!)
                  ? "bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800"
                  : "bg-gray-50 dark:bg-[#1F1F23]"
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: project.color + "20", color: project.color }}
              >
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {project.name}
                  </h4>
                  {(isOverdue(project.deadline!) || isDueSoon(project.deadline!)) && (
                    <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${
                      isOverdue(project.deadline!) ? "text-red-500" : "text-yellow-500"
                    }`} />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                  <span className={`text-xs ${
                    isOverdue(project.deadline!)
                      ? "text-red-600 dark:text-red-400 font-medium"
                      : "text-gray-500"
                  }`}>
                    {isOverdue(project.deadline!)
                      ? `Overdue by ${formatDistanceToNow(new Date(project.deadline!))}`
                      : format(new Date(project.deadline!), "MMM d, yyyy")
                    }
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {project.progress}%
                </div>
                <div className="w-16 h-1.5 bg-gray-200 dark:bg-[#2A2A2E] rounded-full mt-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: project.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
