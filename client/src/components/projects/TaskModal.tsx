import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import {
  updateTask,
  deleteTask,
  fetchComments,
  addComment,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from "../../store/slices/projectSlice"
import { showSuccessToast, showErrorToast } from "../../store/slices/toastSlice"
import { formatDistanceToNow, format } from "date-fns"
import {
  X,
  Calendar,
  User,
  Flag,
  Tag,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Clock,
  Trash2,
  Edit2,
  Send,
  Plus,
  Check,
} from "lucide-react"

interface TaskModalProps {
  task: Task
  projectId: string
  isOpen: boolean
  onClose: () => void
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "backlog", label: "Backlog", color: "#94A3B8" },
  { value: "todo", label: "To Do", color: "#3B82F6" },
  { value: "in_progress", label: "In Progress", color: "#F59E0B" },
  { value: "review", label: "Review", color: "#8B5CF6" },
  { value: "done", label: "Done", color: "#22C55E" },
]

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "#94A3B8" },
  { value: "medium", label: "Medium", color: "#3B82F6" },
  { value: "high", label: "High", color: "#F59E0B" },
  { value: "urgent", label: "Urgent", color: "#EF4444" },
]

export default function TaskModal({ task, projectId, isOpen, onClose }: TaskModalProps) {
  const dispatch = useAppDispatch()
  const { comments, commentsLoading, members } = useAppSelector((state) => state.projects)
  const { user } = useAppSelector((state) => state.auth)

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate || "",
    assigneeId: task.assigneeId || "",
    labels: task.labels || [],
  })
  const [newComment, setNewComment] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [showLabelInput, setShowLabelInput] = useState(false)

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchComments(task.id))
    }
  }, [dispatch, task.id, isOpen])

  const handleSave = async () => {
    try {
      await dispatch(
        updateTask({
          taskId: task.id,
          ...editData,
        })
      ).unwrap()
      dispatch(showSuccessToast("Task updated successfully"))
      setIsEditing(false)
    } catch (error) {
      dispatch(showErrorToast("Failed to update task"))
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return
    try {
      await dispatch(deleteTask(task.id)).unwrap()
      dispatch(showSuccessToast("Task deleted"))
      onClose()
    } catch (error) {
      dispatch(showErrorToast("Failed to delete task"))
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    try {
      await dispatch(
        addComment({
          taskId: task.id,
          content: newComment,
        })
      ).unwrap()
      setNewComment("")
      dispatch(showSuccessToast("Comment added"))
    } catch (error) {
      dispatch(showErrorToast("Failed to add comment"))
    }
  }

  const handleAddLabel = () => {
    if (!newLabel.trim()) return
    if (!editData.labels.includes(newLabel)) {
      setEditData({ ...editData, labels: [...editData.labels, newLabel] })
    }
    setNewLabel("")
    setShowLabelInput(false)
  }

  const removeLabel = (label: string) => {
    setEditData({ ...editData, labels: editData.labels.filter((l) => l !== label) })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-3xl bg-white dark:bg-[#0F0F12] rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    STATUS_OPTIONS.find((s) => s.value === (isEditing ? editData.status : task.status))?.color,
                }}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {task.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-[#1DA1F2] text-white rounded-lg text-sm hover:bg-[#1890D8] transition-colors"
                >
                  Save Changes
                </button>
              )}
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-3 gap-6">
              {/* Main Content - 2/3 */}
              <div className="col-span-2 space-y-6">
                {/* Title */}
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full text-xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-[#1F1F23] focus:border-[#1DA1F2] focus:outline-none pb-2"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {task.title}
                  </h2>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={4}
                      placeholder="Add a description..."
                      className="w-full p-3 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                    />
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {task.description || "No description provided"}
                    </p>
                  )}
                </div>

                {/* Labels */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Labels
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(isEditing ? editData.labels : task.labels)?.map((label) => (
                      <span
                        key={label}
                        className="px-2 py-1 text-sm rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] flex items-center gap-1"
                      >
                        {label}
                        {isEditing && (
                          <button
                            onClick={() => removeLabel(label)}
                            className="hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {isEditing && (
                      showLabelInput ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
                            placeholder="Label name"
                            className="px-2 py-1 text-sm border border-gray-200 dark:border-[#1F1F23] rounded bg-white dark:bg-[#1F1F23] focus:outline-none"
                            autoFocus
                          />
                          <button onClick={handleAddLabel} className="text-green-500">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setShowLabelInput(false)} className="text-gray-400">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowLabelInput(true)}
                          className="px-2 py-1 text-sm text-[#1DA1F2] border border-dashed border-[#1DA1F2] rounded-full hover:bg-[#1DA1F2]/5"
                        >
                          <Plus className="h-3 w-3 inline mr-1" />
                          Add Label
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments ({comments.length})
                  </h3>

                  {/* Add Comment */}
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#1DA1F2] text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                      {user?.fullName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-3 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1890D8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  {commentsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-[#1F1F23] rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-[#1F1F23] rounded w-1/4" />
                            <div className="h-4 bg-gray-200 dark:bg-[#1F1F23] rounded w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-[#2A2A2E] text-gray-600 dark:text-gray-400 text-sm font-medium flex items-center justify-center flex-shrink-0">
                            {comment.author?.fullName?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white text-sm">
                                {comment.author?.fullName || "Unknown"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                              {comment.isEdited && (
                                <span className="text-xs text-gray-400">(edited)</span>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No comments yet
                    </p>
                  )}
                </div>
              </div>

              {/* Sidebar - 1/3 */}
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Status
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value as TaskStatus })}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: STATUS_OPTIONS.find((s) => s.value === task.status)?.color,
                        }}
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {STATUS_OPTIONS.find((s) => s.value === task.status)?.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <Flag className="h-3 w-3" />
                    Priority
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value as TaskPriority })}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none"
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: PRIORITY_OPTIONS.find((p) => p.value === task.priority)?.color,
                        }}
                      />
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {task.priority}
                      </span>
                    </div>
                  )}
                </div>

                {/* Assignee */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Assignee
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.assigneeId}
                      onChange={(e) => setEditData({ ...editData, assigneeId: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      {members?.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.user.fullName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      {task.assignee ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-[#1DA1F2] text-white text-xs font-medium flex items-center justify-center">
                            {task.assignee.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {task.assignee.fullName}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.dueDate}
                      onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-[#1F1F23] rounded-lg bg-gray-50 dark:bg-[#1F1F23] text-gray-900 dark:text-white focus:outline-none"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {task.dueDate
                        ? format(new Date(task.dueDate), "MMM d, yyyy")
                        : "No due date"}
                    </p>
                  )}
                </div>

                {/* Created */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created
                  </label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                  </p>
                </div>

                {/* Reporter */}
                {task.reporter && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Reporter
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-[#2A2A2E] text-gray-600 dark:text-gray-400 text-xs font-medium flex items-center justify-center">
                        {task.reporter.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {task.reporter.fullName}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
