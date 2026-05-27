import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface TaskStats {
  total: number
  backlog: number
  todo: number
  in_progress: number
  review: number
  done: number
}

interface ProjectChartProps {
  taskStats: TaskStats | null
  projectsByPriority: { priority: string; count: number }[] | undefined
  loading?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  backlog: "#94A3B8",
  todo: "#3B82F6",
  in_progress: "#F59E0B",
  review: "#8B5CF6",
  done: "#22C55E",
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "#22C55E",
  medium: "#3B82F6",
  high: "#F59E0B",
  urgent: "#EF4444",
}

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

export default function ProjectChart({ taskStats, projectsByPriority, loading }: ProjectChartProps) {
  const taskChartData = useMemo(() => {
    if (!taskStats) return []
    
    return [
      { name: "Backlog", value: taskStats.backlog, color: STATUS_COLORS.backlog },
      { name: "To Do", value: taskStats.todo, color: STATUS_COLORS.todo },
      { name: "In Progress", value: taskStats.in_progress, color: STATUS_COLORS.in_progress },
      { name: "Review", value: taskStats.review, color: STATUS_COLORS.review },
      { name: "Done", value: taskStats.done, color: STATUS_COLORS.done },
    ]
  }, [taskStats])

  const priorityChartData = useMemo(() => {
    if (!projectsByPriority) return []
    
    return projectsByPriority.map(item => ({
      name: PRIORITY_LABELS[item.priority] || item.priority,
      value: parseInt(String(item.count)),
      color: PRIORITY_COLORS[item.priority] || "#1DA1F2",
    }))
  }, [projectsByPriority])

  if (loading) {
    return (
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
            <div className="h-6 w-40 bg-gray-200 dark:bg-[#1F1F23] rounded mb-4 animate-pulse" />
            <div className="h-64 bg-gray-100 dark:bg-[#1F1F23] rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Tasks by Status - Bar Chart */}
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tasks by Status
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taskChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fill: '#6B7280', fontSize: 12 }} 
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 4, 4, 0]}
                fill="#1DA1F2"
              >
                {taskChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projects by Priority - Pie Chart */}
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Projects by Priority
        </h3>
        <div className="h-64">
          {priorityChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No project data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
