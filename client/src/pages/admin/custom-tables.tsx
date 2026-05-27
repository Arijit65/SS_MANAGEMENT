import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchCustomTables,
  archiveCustomTable,
  restoreCustomTable,
  deleteCustomTable,
} from '../../store/slices/customTablesSlice'
import { showSuccessToast, showErrorToast } from '../../store/slices/toastSlice'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Archive,
  RotateCcw,
  Table2,
  FileText,
  Database,
  LayoutList,
} from 'lucide-react'
import TableWizard from '../../components/custom-tables/table-wizard'

// Icon mapping for custom tables
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Database,
  Table2,
  LayoutList,
}

export default function CustomTablesPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { tables, isLoading, isSubmitting, error } = useAppSelector((s) => s.customTables)

  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<number | null>(null)

  useEffect(() => {
    dispatch(fetchCustomTables({ include_archived: showArchived }))
  }, [dispatch, showArchived])

  const filteredTables = tables.filter((table) => {
    const matchesSearch =
      !search ||
      table.display_name.toLowerCase().includes(search.toLowerCase()) ||
      table.name.toLowerCase().includes(search.toLowerCase())
    const matchesArchived = showArchived ? table.is_archived : !table.is_archived
    return matchesSearch && matchesArchived
  })

  const handleArchive = async (id: number) => {
    const table = tables.find(t => t.id === id)
    if (!window.confirm('Archive this table? It will be hidden from the sidebar but data will be preserved.')) return
    const result = await dispatch(archiveCustomTable(id))
    if (archiveCustomTable.fulfilled.match(result)) {
      dispatch(showSuccessToast('Table Archived', `${table?.display_name || 'Table'} has been archived.`))
    } else {
      dispatch(showErrorToast('Archive Failed', 'Failed to archive the table.'))
    }
  }

  const handleRestore = async (id: number) => {
    const table = tables.find(t => t.id === id)
    const result = await dispatch(restoreCustomTable(id))
    if (restoreCustomTable.fulfilled.match(result)) {
      dispatch(showSuccessToast('Table Restored', `${table?.display_name || 'Table'} has been restored.`))
    } else {
      dispatch(showErrorToast('Restore Failed', 'Failed to restore the table.'))
    }
  }

  const handleDelete = async (id: number) => {
    const table = tables.find(t => t.id === id)
    if (!window.confirm('PERMANENTLY delete this table and ALL its data? This cannot be undone!')) return
    const result = await dispatch(deleteCustomTable(id))
    if (deleteCustomTable.fulfilled.match(result)) {
      dispatch(showSuccessToast('Table Deleted', `${table?.display_name || 'Table'} has been permanently deleted.`))
    } else {
      dispatch(showErrorToast('Delete Failed', 'Failed to delete the table.'))
    }
  }

  const handleEditTable = (id: number) => {
    setEditingTable(id)
    setWizardOpen(true)
  }

  const handleWizardClose = () => {
    setWizardOpen(false)
    setEditingTable(null)
    dispatch(fetchCustomTables({ include_archived: showArchived }))
  }

  const getIconComponent = (iconName: string) => {
    const IconComp = ICON_MAP[iconName] || FileText
    return IconComp
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Custom Tables</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage dynamic data tables
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTable(null)
            setWizardOpen(true)
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Custom Table
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              !showArchived
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              showArchived
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tables Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="text-center py-16">
          <Database className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {showArchived ? 'No archived tables.' : 'No custom tables yet. Create one to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTables.map((table) => {
            const IconComp = getIconComponent(table.icon)
            return (
              <div
                key={table.id}
                className={`bg-white dark:bg-[#1F1F23] rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow ${
                  table.is_archived ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <IconComp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{table.display_name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">/{table.name}</p>
                    </div>
                  </div>
                  {table.is_archived && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                      Archived
                    </span>
                  )}
                </div>

                {table.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {table.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>{table.field_count ?? table.fields?.length ?? 0} fields</span>
                  <span>{table.record_count ?? 0} records</span>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                  {!table.is_archived ? (
                    <>
                      <button
                        onClick={() => navigate(`/custom/${table.name}/list`)}
                        className="flex-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        View Data
                      </button>
                      <button
                        onClick={() => handleEditTable(table.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(table.id)}
                        disabled={isSubmitting}
                        className="p-2 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRestore(table.id)}
                        disabled={isSubmitting}
                        className="flex-1 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4 inline mr-1" />
                        Restore
                      </button>
                      <button
                        onClick={() => handleDelete(table.id)}
                        disabled={isSubmitting}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table Wizard Modal */}
      {wizardOpen && (
        <TableWizard
          tableId={editingTable}
          onClose={handleWizardClose}
        />
      )}
    </div>
  )
}
