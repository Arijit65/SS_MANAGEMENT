import { useState } from "react"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { createTask, type TaskStatus, type TaskPriority, type TaskType } from "../../store/slices/projectSlice"
import { showSuccessToast, showErrorToast } from "../../store/slices/toastSlice"
import { X, Plus, Check } from "lucide-react"

interface CreateTaskModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
  defaultStatus?: TaskStatus
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
]

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: "task", label: "Task" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "documentation", label: "Documentation" },
]

export default function CreateTaskModal({
  projectId,
  isOpen,
  onClose,
  defaultStatus = "todo",
}: CreateTaskModalProps) {
  const dispatch = useAppDispatch()
  const { members } = useAppSelector((state) => state.projects)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: defaultStatus,
    priority: "medium" as TaskPriority,
    type: "task" as TaskType,
    assigneeId: "",
    dueDate: "",
    labels: [] as string[],
  })
  const [newLabel, setNewLabel] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      dispatch(showErrorToast("Title is required"))
      return
    }

    setIsSubmitting(true)
    try {
      await dispatch(
        createTask({
          projectId,
          ...formData,
          assigneeId: formData.assigneeId || undefined,
          dueDate: formData.dueDate || undefined,
        })
      ).unwrap()
      dispatch(showSuccessToast("Task created successfully"))
      onClose()
      // Reset form
      setFormData({
        title: "",
        description: "",
        status: defaultStatus,
        priority: "medium",
        type: "task",
        assigneeId: "",
        dueDate: "",
        labels: [],
      })
    } catch (error) {
      dispatch(showErrorToast("Failed to create task"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const addLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData({ ...formData, labels: [...formData.labels, newLabel.trim()] })
      setNewLabel("")
    }
  }

  const removeLabel = (label: string) => {
    setFormData({ ...formData, labels: formData.labels.filter((l) => l !== label) })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white dark:bg-[#0F0F12] rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#1F1F23]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create New Task
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20 focus:border-[#1DA1F2]"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20 focus:border-[#1DA1F2]"
              />
            </div>

            {/* Status & Priority & Type */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignee & Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assignee
                </label>
                <select
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                >
                  <option value="">Unassigned</option>
                  {members?.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                />
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Labels
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.labels.map((label) => (
                  <span
                    key={label}
                    className="px-2 py-1 text-sm rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] flex items-center gap-1"
                  >
                    {label}
                    <button type="button" onClick={() => removeLabel(label)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLabel())}
                  placeholder="Add a label"
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                />
                <button
                  type="button"
                  onClick={addLabel}
                  className="px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#1F1F23]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1890D8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Task
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
