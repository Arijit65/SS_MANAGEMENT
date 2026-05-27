import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCustomTables } from '@/store/slices/customTablesSlice'
import { hasTablePermission } from '@/store/slices/authSlice'
import { Table2, FileText, Database, LayoutList } from 'lucide-react'

export default function DataTablesPage() {
  const dispatch = useAppDispatch()
  const { tables: customTables, isLoading } = useAppSelector((state) => state.customTables)
  const user = useAppSelector((state) => state.auth.user)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    dispatch(fetchCustomTables())
  }, [dispatch])

  // Filter tables based on user permissions
  const accessibleTables = customTables.filter((table) => {
    if (table.is_archived || !table.is_active) return false
    // Admin can see all, non-admin must have permission
    if (isAdmin) return true
    return hasTablePermission(user, table.name, 'canView')
  })

  // Icon mapping
  const iconMap: Record<string, React.ComponentType<any>> = {
    FileText,
    Database,
    Table2,
    LayoutList,
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Tables</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Access tables that you have permission to view
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading tables...</div>
        </div>
      ) : accessibleTables.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Table2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tables available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have access to any data tables yet. Contact your administrator for access.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessibleTables.map((table) => {
            const Icon = iconMap[table.icon] || FileText
            return (
              <Link
                key={table.id}
                to={`/custom/${table.name}/list`}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {table.display_name}
                    </h3>
                    {table.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {table.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
