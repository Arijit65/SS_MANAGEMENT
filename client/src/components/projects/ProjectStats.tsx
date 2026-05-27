import type React from "react"
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

interface StatCardProps {
  title: string
  value: number | string
  change?: string
  changeType?: "increase" | "decrease"
  icon: React.ReactNode
  description: string
  color?: string
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  description,
  color = "#1DA1F2",
}) => (
  <div
    className="bg-white dark:bg-[#0F0F12] rounded-xl p-4 sm:p-5 border-l-4 border border-gray-200 dark:border-[#1F1F23] hover:shadow-lg hover:shadow-[#1DA1F2]/5 transition-all duration-200"
    style={{ borderLeftColor: color }}
  >
    <div className="flex items-center justify-between pb-2">
      <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#1F1F23]" style={{ color }}>
        {icon}
      </div>
      {change && (
        <div className="flex items-center text-xs">
          {changeType === "increase" ? (
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
          )}
          <span className={`font-medium ${changeType === "increase" ? "text-green-600" : "text-red-500"}`}>
            {change}
          </span>
        </div>
      )}
    </div>
    <div className="space-y-1 mt-3">
      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  </div>
)

interface ProjectStatsProps {
  stats: {
    projects: {
      total: number
      active: number
      completed: number
      on_hold: number
    }
    tasks: {
      total: number
      done: number
    }
    overdueTasks: number
  } | null
  loading?: boolean
}

export default function ProjectStats({ stats, loading }: ProjectStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-[#0F0F12] rounded-xl p-5 border border-gray-200 dark:border-[#1F1F23] animate-pulse">
            <div className="flex items-center justify-between pb-2">
              <div className="w-10 h-10 bg-gray-200 dark:bg-[#1F1F23] rounded-lg" />
              <div className="w-12 h-4 bg-gray-200 dark:bg-[#1F1F23] rounded" />
            </div>
            <div className="space-y-2 mt-3">
              <div className="w-16 h-8 bg-gray-200 dark:bg-[#1F1F23] rounded" />
              <div className="w-24 h-4 bg-gray-200 dark:bg-[#1F1F23] rounded" />
              <div className="w-20 h-3 bg-gray-200 dark:bg-[#1F1F23] rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const statCards: StatCardProps[] = [
    {
      title: "Total Projects",
      value: stats?.projects.total || 0,
      icon: <FolderKanban className="h-5 w-5" />,
      description: "All projects",
      color: "#1DA1F2",
    },
    {
      title: "Active Projects",
      value: stats?.projects.active || 0,
      change: stats?.projects.active ? `${Math.round((stats.projects.active / (stats.projects.total || 1)) * 100)}%` : undefined,
      changeType: "increase",
      icon: <Clock className="h-5 w-5" />,
      description: "Currently in progress",
      color: "#3B82F6",
    },
    {
      title: "Completed",
      value: stats?.projects.completed || 0,
      icon: <CheckCircle2 className="h-5 w-5" />,
      description: "Successfully delivered",
      color: "#22C55E",
    },
    {
      title: "Overdue Tasks",
      value: stats?.overdueTasks || 0,
      icon: <AlertTriangle className="h-5 w-5" />,
      description: "Need attention",
      color: stats?.overdueTasks ? "#EF4444" : "#22C55E",
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}
