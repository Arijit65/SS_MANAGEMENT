import { formatDistanceToNow } from "date-fns"
import {
  FolderPlus,
  FileEdit,
  CheckCircle2,
  UserPlus,
  Upload,
  MessageSquare,
  Trash2,
  Archive,
  RotateCcw,
  GitBranch,
} from "lucide-react"

interface Activity {
  id: string
  activityType: string
  description?: string
  user?: { id: string; fullName: string }
  project?: { id: string; name: string }
  createdAt: string
}

interface ActivityFeedProps {
  activities: Activity[]
  loading?: boolean
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  project_created: <FolderPlus className="h-4 w-4" />,
  project_updated: <FileEdit className="h-4 w-4" />,
  project_archived: <Archive className="h-4 w-4" />,
  project_restored: <RotateCcw className="h-4 w-4" />,
  task_created: <FolderPlus className="h-4 w-4" />,
  task_updated: <FileEdit className="h-4 w-4" />,
  task_deleted: <Trash2 className="h-4 w-4" />,
  task_status_changed: <GitBranch className="h-4 w-4" />,
  task_assigned: <UserPlus className="h-4 w-4" />,
  task_completed: <CheckCircle2 className="h-4 w-4" />,
  member_added: <UserPlus className="h-4 w-4" />,
  member_removed: <Trash2 className="h-4 w-4" />,
  member_role_changed: <FileEdit className="h-4 w-4" />,
  file_uploaded: <Upload className="h-4 w-4" />,
  file_deleted: <Trash2 className="h-4 w-4" />,
  comment_added: <MessageSquare className="h-4 w-4" />,
  comment_edited: <FileEdit className="h-4 w-4" />,
  comment_deleted: <Trash2 className="h-4 w-4" />,
}

const ACTIVITY_COLORS: Record<string, string> = {
  project_created: "bg-green-100 text-green-600",
  project_updated: "bg-blue-100 text-blue-600",
  project_archived: "bg-gray-100 text-gray-600",
  project_restored: "bg-purple-100 text-purple-600",
  task_created: "bg-green-100 text-green-600",
  task_updated: "bg-blue-100 text-blue-600",
  task_deleted: "bg-red-100 text-red-600",
  task_status_changed: "bg-yellow-100 text-yellow-600",
  task_assigned: "bg-purple-100 text-purple-600",
  task_completed: "bg-green-100 text-green-600",
  member_added: "bg-blue-100 text-blue-600",
  member_removed: "bg-red-100 text-red-600",
  member_role_changed: "bg-yellow-100 text-yellow-600",
  file_uploaded: "bg-blue-100 text-blue-600",
  file_deleted: "bg-red-100 text-red-600",
  comment_added: "bg-purple-100 text-purple-600",
  comment_edited: "bg-yellow-100 text-yellow-600",
  comment_deleted: "bg-red-100 text-red-600",
}

export default function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-[#1F1F23] rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-[#1F1F23] rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-[#1F1F23] rounded w-1/2" />
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
        Recent Activity
      </h3>
      
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 group">
              <div
                className={`p-2 rounded-full flex-shrink-0 ${
                  ACTIVITY_COLORS[activity.activityType] || "bg-gray-100 text-gray-600"
                }`}
              >
                {ACTIVITY_ICONS[activity.activityType] || <FileEdit className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">{activity.user?.fullName || "System"}</span>
                  {" "}
                  <span className="text-gray-600 dark:text-gray-400">
                    {activity.description || activity.activityType.replace(/_/g, " ")}
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {activity.project && (
                    <span className="text-xs text-[#1DA1F2] font-medium">
                      {activity.project.name}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
