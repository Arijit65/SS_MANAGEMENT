import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { fetchProjectStats } from "../../store/slices/projectSlice"
import ProjectStats from "./ProjectStats"
import ProjectChart from "./ProjectChart"
import ActivityFeed from "./ActivityFeed"
import UpcomingDeadlines from "./UpcomingDeadlines"
import { Plus, ArrowRight, FolderKanban, Calendar, LayoutGrid } from "lucide-react"

export default function ProjectDashboard() {
  const dispatch = useAppDispatch()
  const { stats, statsLoading } = useAppSelector((state) => state.projects)

  useEffect(() => {
    dispatch(fetchProjectStats())
  }, [dispatch])

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1DA1F2]">Project Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your projects, manage tasks, and collaborate with your team
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/projects/new"
            className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1890D8] transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
          <Link
            to="/projects/list"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors text-sm font-medium flex items-center gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            View All
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link
          to="/projects/list"
          className="group bg-white dark:bg-[#0F0F12] rounded-xl p-4 border border-gray-200 dark:border-[#1F1F23] hover:border-[#1DA1F2] hover:shadow-lg hover:shadow-[#1DA1F2]/5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2]">
              <FolderKanban className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#1DA1F2] group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mt-3">Projects</h3>
          <p className="text-xs text-gray-500 mt-1">View and manage all projects</p>
        </Link>

        <Link
          to="/projects/calendar"
          className="group bg-white dark:bg-[#0F0F12] rounded-xl p-4 border border-gray-200 dark:border-[#1F1F23] hover:border-[#1DA1F2] hover:shadow-lg hover:shadow-[#1DA1F2]/5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#1DA1F2] group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mt-3">Calendar</h3>
          <p className="text-xs text-gray-500 mt-1">View deadlines and events</p>
        </Link>

        <Link
          to="/projects/list?status=active"
          className="group bg-white dark:bg-[#0F0F12] rounded-xl p-4 border border-gray-200 dark:border-[#1F1F23] hover:border-[#1DA1F2] hover:shadow-lg hover:shadow-[#1DA1F2]/5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#1DA1F2] group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mt-3">Active Projects</h3>
          <p className="text-xs text-gray-500 mt-1">Currently in progress</p>
        </Link>

        <Link
          to="/projects/list?archived=true"
          className="group bg-white dark:bg-[#0F0F12] rounded-xl p-4 border border-gray-200 dark:border-[#1F1F23] hover:border-[#1DA1F2] hover:shadow-lg hover:shadow-[#1DA1F2]/5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <FolderKanban className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#1DA1F2] group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mt-3">Archived</h3>
          <p className="text-xs text-gray-500 mt-1">Completed projects</p>
        </Link>
      </div>

      {/* Stats Cards */}
      <ProjectStats stats={stats} loading={statsLoading} />

      {/* Charts */}
      <ProjectChart
        taskStats={stats?.tasks || null}
        projectsByPriority={stats?.projectsByPriority}
        loading={statsLoading}
      />

      {/* Activity & Deadlines */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <ActivityFeed activities={stats?.recentActivity || []} loading={statsLoading} />
        <UpcomingDeadlines projects={stats?.upcomingDeadlines || []} loading={statsLoading} />
      </div>
    </div>
  )
}
