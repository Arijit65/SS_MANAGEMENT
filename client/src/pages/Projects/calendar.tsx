import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { fetchProjects, fetchTasks, type Task } from "../../store/slices/projectSlice"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Grid,
  List,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Link } from "react-router-dom"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns"

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  high: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  urgent: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
}

export default function CalendarPage() {
  const dispatch = useAppDispatch()
  const { projects, tasks } = useAppSelector((state) => state.projects)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"month" | "week">("month")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    dispatch(fetchProjects({ page: 1, limit: 100 }))
  }, [dispatch])

  // Combine all deadlines from projects and tasks
  const allDeadlines = [
    ...projects.map((p) => ({
      id: p.id,
      title: p.name,
      date: p.deadline,
      type: "project" as const,
      priority: p.priority,
      status: p.status,
    })),
    ...tasks.map((t) => ({
      id: t.id,
      title: t.title,
      date: t.dueDate,
      type: "task" as const,
      priority: t.priority,
      status: t.status,
    })),
  ].filter((item) => item.date)

  const getDeadlinesForDate = (date: Date) => {
    return allDeadlines.filter(
      (item) => item.date && isSameDay(parseISO(item.date), date)
    )
  }

  // Calendar grid generation
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const generateCalendarDays = () => {
    const days: Date[] = []
    let day = calendarStart
    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }

  const calendarDays = generateCalendarDays()

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const selectedDateDeadlines = selectedDate ? getDeadlinesForDate(selectedDate) : []

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
              <p className="text-sm text-gray-500">View project and task deadlines</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Month Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[180px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <button
                onClick={() => navigateMonth("next")}
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

            {/* View Toggle */}
            <div className="flex items-center border border-gray-200 dark:border-[#1F1F23] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("month")}
                className={`p-2 ${
                  viewMode === "month"
                    ? "bg-[#1DA1F2] text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1F1F23]"
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`p-2 ${
                  viewMode === "week"
                    ? "bg-[#1DA1F2] text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1F1F23]"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex gap-6">
        {/* Calendar Grid */}
        <div className="flex-1 bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-50 dark:bg-[#1F1F23] border-b border-gray-200 dark:border-[#2A2A2E]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayDeadlines = getDeadlinesForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[100px] p-2 border-b border-r border-gray-100 dark:border-[#1F1F23] text-left transition-colors ${
                    isCurrentMonth
                      ? "bg-white dark:bg-[#0F0F12]"
                      : "bg-gray-50 dark:bg-[#0A0A0C]"
                  } ${
                    isSelected
                      ? "ring-2 ring-inset ring-[#1DA1F2]"
                      : "hover:bg-gray-50 dark:hover:bg-[#1F1F23]"
                  }`}
                >
                  <div
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 ${
                      isToday(day)
                        ? "bg-[#1DA1F2] text-white font-semibold"
                        : isCurrentMonth
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  
                  {/* Deadline indicators */}
                  <div className="space-y-1">
                    {dayDeadlines.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className={`text-xs px-1.5 py-0.5 rounded truncate ${
                          item.type === "project"
                            ? "bg-[#1DA1F2]/10 text-[#1DA1F2]"
                            : PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS]
                        }`}
                      >
                        {item.title}
                      </div>
                    ))}
                    {dayDeadlines.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1">
                        +{dayDeadlines.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Date Panel */}
        <div className="w-80 bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-[#1F1F23]">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a date"}
            </h3>
          </div>

          <div className="p-4">
            {!selectedDate ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Click a date to see deadlines</p>
              </div>
            ) : selectedDateDeadlines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No deadlines on this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateDeadlines.map((item) => (
                  <Link
                    key={item.id}
                    to={item.type === "project" ? `/projects/${item.id}` : "#"}
                    className="block p-3 bg-gray-50 dark:bg-[#1F1F23] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2E] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          item.type === "project" ? "bg-[#1DA1F2]" : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-1.5 py-0.5 text-xs rounded ${
                              item.type === "project"
                                ? "bg-[#1DA1F2]/10 text-[#1DA1F2]"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {item.type}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-xs rounded ${
                              PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS]
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines Section */}
      <div className="px-6 pb-6">
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#1DA1F2]" />
            Upcoming Deadlines (Next 7 Days)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 7 }).map((_, index) => {
              const date = addDays(new Date(), index)
              const deadlines = getDeadlinesForDate(date)
              if (deadlines.length === 0) return null

              return (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-[#1F1F23] rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isToday(date) && (
                      <span className="w-2 h-2 bg-[#1DA1F2] rounded-full" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {isToday(date) ? "Today" : format(date, "EEE, MMM d")}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({deadlines.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {deadlines.map((item) => (
                      <div
                        key={item.id}
                        className="text-sm text-gray-700 dark:text-gray-300 truncate"
                      >
                        • {item.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }).filter(Boolean)}
          </div>
        </div>
      </div>
    </div>
  )
}
