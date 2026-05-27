import { useState, useEffect, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { fetchProjects, fetchTasks, type Task } from "../../store/slices/projectSlice"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  MoreHorizontal,
} from "lucide-react"
import { Link } from "react-router-dom"
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  subMonths,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
  startOfWeek,
  endOfWeek,
} from "date-fns"

type TimelineItem = {
  id: string
  title: string
  startDate: Date | null
  endDate: Date | null
  type: "project" | "task"
  priority: string
  status: string
  progress?: number
  color?: string
  projectId?: string
}

const PRIORITY_COLORS = {
  low: "#22C55E",
  medium: "#EAB308",
  high: "#F97316",
  urgent: "#EF4444",
}

const STATUS_COLORS = {
  planning: "#6B7280",
  active: "#3B82F6",
  in_progress: "#3B82F6",
  on_hold: "#EAB308",
  completed: "#22C55E",
  done: "#22C55E",
  archived: "#9CA3AF",
}

export default function TimelinePage() {
  const dispatch = useAppDispatch()
  const { projects, tasks } = useAppSelector((state) => state.projects)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [zoomLevel, setZoomLevel] = useState<"day" | "week" | "month">("week")
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  useEffect(() => {
    dispatch(fetchProjects({ page: 1, limit: 100 }))
  }, [dispatch])

  // Calculate timeline range based on zoom level
  const timelineRange = useMemo(() => {
    const start = startOfMonth(subMonths(currentDate, 1))
    const end = endOfMonth(addMonths(currentDate, 2))
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Get column width based on zoom level
  const getColumnWidth = () => {
    switch (zoomLevel) {
      case "day":
        return 40
      case "week":
        return 20
      case "month":
        return 8
    }
  }

  const columnWidth = getColumnWidth()

  // Combine projects and tasks into timeline items
  const timelineItems: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = []

    projects.forEach((project) => {
      items.push({
        id: project.id,
        title: project.name,
        startDate: project.startDate ? parseISO(project.startDate) : new Date(),
        endDate: project.deadline ? parseISO(project.deadline) : addWeeks(new Date(), 2),
        type: "project",
        priority: project.priority,
        status: project.status,
        progress: project.progress,
        color: project.color || "#1DA1F2",
      })

      // Add tasks if project is expanded
      if (expandedProjects.has(project.id)) {
        const projectTasks = tasks.filter((t) => t.projectId === project.id)
        projectTasks.forEach((task) => {
          items.push({
            id: task.id,
            title: task.title,
            startDate: task.startDate ? parseISO(task.startDate) : null,
            endDate: task.dueDate ? parseISO(task.dueDate) : null,
            type: "task",
            priority: task.priority,
            status: task.status,
            projectId: project.id,
            color: PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS],
          })
        })
      }
    })

    return items
  }, [projects, tasks, expandedProjects])

  const toggleProjectExpand = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
      // Fetch tasks for this project if not already loaded
      dispatch(fetchTasks(projectId))
    }
    setExpandedProjects(newExpanded)
  }

  const navigateTimeline = (direction: "prev" | "next") => {
    setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleZoom = (direction: "in" | "out") => {
    if (direction === "in") {
      if (zoomLevel === "month") setZoomLevel("week")
      else if (zoomLevel === "week") setZoomLevel("day")
    } else {
      if (zoomLevel === "day") setZoomLevel("week")
      else if (zoomLevel === "week") setZoomLevel("month")
    }
  }

  // Calculate bar position and width
  const getBarStyle = (item: TimelineItem) => {
    if (!item.startDate || !item.endDate) return null

    const startIndex = differenceInDays(item.startDate, timelineRange[0])
    const duration = differenceInDays(item.endDate, item.startDate) + 1

    if (startIndex + duration < 0 || startIndex >= timelineRange.length) {
      return null // Item is outside visible range
    }

    const left = Math.max(0, startIndex) * columnWidth
    const width = Math.max(columnWidth, Math.min(duration, timelineRange.length - startIndex) * columnWidth)

    return {
      left,
      width,
      backgroundColor: item.color || "#1DA1F2",
    }
  }

  // Group days by month for header
  const monthGroups = useMemo(() => {
    const groups: { month: Date; days: Date[] }[] = []
    let currentMonth: Date | null = null
    let currentDays: Date[] = []

    timelineRange.forEach((day) => {
      if (!currentMonth || !isSameMonth(day, currentMonth)) {
        if (currentMonth) {
          groups.push({ month: currentMonth, days: currentDays })
        }
        currentMonth = day
        currentDays = [day]
      } else {
        currentDays.push(day)
      }
    })

    if (currentMonth) {
      groups.push({ month: currentMonth, days: currentDays })
    }

    return groups
  }, [timelineRange])

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timeline</h1>
              <p className="text-sm text-gray-500">Gantt chart view of projects and tasks</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTimeline("prev")}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[180px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <button
                onClick={() => navigateTimeline("next")}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={goToToday}
                className="ml-2 px-3 py-1.5 text-sm text-[#1DA1F2] hover:bg-[#1DA1F2]/10 rounded-lg transition-colors"
              >
                Today
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleZoom("out")}
                disabled={zoomLevel === "month"}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors disabled:opacity-50"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-500 min-w-[60px] text-center">
                {zoomLevel === "day" ? "Day" : zoomLevel === "week" ? "Week" : "Month"}
              </span>
              <button
                onClick={() => handleZoom("in")}
                disabled={zoomLevel === "day"}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors disabled:opacity-50"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="p-6">
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
          <div className="flex">
            {/* Left Panel - Item Names */}
            <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-[#1F1F23]">
              {/* Header */}
              <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-[#1F1F23] bg-gray-50 dark:bg-[#1F1F23]">
                <span className="font-medium text-gray-700 dark:text-gray-300">Projects & Tasks</span>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
                {timelineItems.map((item) => (
                  <div
                    key={item.id}
                    className={`h-12 flex items-center px-4 hover:bg-gray-50 dark:hover:bg-[#1F1F23] transition-colors ${
                      item.type === "task" ? "pl-8" : ""
                    }`}
                  >
                    {item.type === "project" && (
                      <button
                        onClick={() => toggleProjectExpand(item.id)}
                        className="mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedProjects.has(item.id) ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    )}
                    <div
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-900 dark:text-white truncate flex-1">
                      {item.title}
                    </span>
                    {item.type === "project" && item.progress !== undefined && (
                      <span className="text-xs text-gray-500 ml-2">{item.progress}%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Timeline */}
            <div className="flex-1 overflow-x-auto">
              {/* Timeline Header */}
              <div className="h-16 flex flex-col border-b border-gray-200 dark:border-[#1F1F23] bg-gray-50 dark:bg-[#1F1F23]">
                {/* Month row */}
                <div className="flex h-8 border-b border-gray-100 dark:border-[#2A2A2E]">
                  {monthGroups.map((group, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 flex items-center justify-center border-r border-gray-100 dark:border-[#2A2A2E] text-xs font-medium text-gray-600 dark:text-gray-400"
                      style={{ width: group.days.length * columnWidth }}
                    >
                      {format(group.month, "MMMM yyyy")}
                    </div>
                  ))}
                </div>

                {/* Days row */}
                <div className="flex h-8">
                  {timelineRange.map((day, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 flex items-center justify-center text-xs border-r border-gray-100 dark:border-[#2A2A2E] ${
                        isToday(day)
                          ? "bg-[#1DA1F2]/10 text-[#1DA1F2] font-medium"
                          : "text-gray-500"
                      }`}
                      style={{ width: columnWidth }}
                    >
                      {zoomLevel === "day" ? format(day, "d") : index % 7 === 0 ? format(day, "d") : ""}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Bars */}
              <div className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
                {timelineItems.map((item) => {
                  const barStyle = getBarStyle(item)
                  
                  return (
                    <div
                      key={item.id}
                      className="h-12 relative"
                      style={{ width: timelineRange.length * columnWidth }}
                    >
                      {/* Today line */}
                      {timelineRange.findIndex((d) => isToday(d)) >= 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-[#1DA1F2] z-10"
                          style={{
                            left: timelineRange.findIndex((d) => isToday(d)) * columnWidth + columnWidth / 2,
                          }}
                        />
                      )}

                      {/* Bar */}
                      {barStyle && (
                        <div
                          className="absolute top-2 h-8 rounded-md shadow-sm flex items-center px-2 text-xs text-white font-medium truncate cursor-pointer hover:brightness-110 transition-all"
                          style={barStyle}
                          title={`${item.title} (${item.startDate ? format(item.startDate, "MMM d") : ""} - ${item.endDate ? format(item.endDate, "MMM d") : ""})`}
                        >
                          {barStyle.width > 80 && item.title}
                          {item.type === "project" && item.progress !== undefined && barStyle.width > 120 && (
                            <span className="ml-auto opacity-75">{item.progress}%</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-6">
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#1DA1F2]" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Project</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Low Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Urgent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-[#1DA1F2]" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
