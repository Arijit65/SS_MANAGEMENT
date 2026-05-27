import { useState, useCallback } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import {
  updateTaskStatus,
  reorderTasks,
  optimisticUpdateTaskStatus,
  setTasksByStatus,
  type Task,
  type TaskStatus,
} from "../../store/slices/projectSlice"
import { showSuccessToast, showErrorToast } from "../../store/slices/toastSlice"
import TaskCard from "./TaskCard"
import TaskModal from "./TaskModal"
import { Plus, MoreHorizontal } from "lucide-react"

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "#94A3B8" },
  { id: "todo", title: "To Do", color: "#3B82F6" },
  { id: "in_progress", title: "In Progress", color: "#F59E0B" },
  { id: "review", title: "Review", color: "#8B5CF6" },
  { id: "done", title: "Done", color: "#22C55E" },
]

interface TaskBoardProps {
  projectId: string
  onCreateTask: (status: TaskStatus) => void
}

export default function TaskBoard({ projectId, onCreateTask }: TaskBoardProps) {
  const dispatch = useAppDispatch()
  const { tasksByStatus, tasksLoading } = useAppSelector((state) => state.projects)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result

      // Dropped outside a valid droppable
      if (!destination) return

      // Dropped in the same position
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return
      }

      const sourceStatus = source.droppableId as TaskStatus
      const destStatus = destination.droppableId as TaskStatus
      const taskId = draggableId

      // Create a copy of the current state
      const newTasksByStatus = { ...tasksByStatus }
      const sourceList = [...newTasksByStatus[sourceStatus]]
      const destList =
        sourceStatus === destStatus ? sourceList : [...newTasksByStatus[destStatus]]

      // Find the task being moved
      const [movedTask] = sourceList.splice(source.index, 1)
      if (!movedTask) return

      // Update task status if moving to different column
      const updatedTask = {
        ...movedTask,
        status: destStatus,
        order: destination.index,
      }

      // Insert at new position
      destList.splice(destination.index, 0, updatedTask)

      // Update state optimistically
      newTasksByStatus[sourceStatus] = sourceList
      newTasksByStatus[destStatus] = destList

      // Recalculate order for affected columns
      newTasksByStatus[sourceStatus] = newTasksByStatus[sourceStatus].map((t, i) => ({
        ...t,
        order: i,
      }))
      newTasksByStatus[destStatus] = newTasksByStatus[destStatus].map((t, i) => ({
        ...t,
        order: i,
      }))

      dispatch(setTasksByStatus(newTasksByStatus))

      try {
        // Update on server
        await dispatch(
          updateTaskStatus({
            taskId,
            status: destStatus,
            order: destination.index,
          })
        ).unwrap()
      } catch (error) {
        // Revert on error
        dispatch(showErrorToast("Failed to update task"))
        // Refetch tasks to restore correct state
      }
    },
    [dispatch, tasksByStatus]
  )

  const openTaskModal = (task: Task) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const closeTaskModal = () => {
    setSelectedTask(null)
    setIsTaskModalOpen(false)
  }

  if (tasksLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-72 bg-gray-50 dark:bg-[#1F1F23] rounded-xl p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  {column.title}
                </span>
              </div>
              <div className="w-6 h-6 bg-gray-200 dark:bg-[#2A2A2E] rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#0F0F12] rounded-lg p-3 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 dark:bg-[#2A2A2E] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-[#2A2A2E] rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 bg-gray-50 dark:bg-[#1F1F23] rounded-xl p-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {column.title}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-200 dark:bg-[#2A2A2E] px-2 py-0.5 rounded-full">
                    {tasksByStatus[column.id]?.length || 0}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onCreateTask(column.id)}
                    className="p-1.5 text-gray-400 hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 rounded transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] transition-colors rounded-lg p-1 ${
                      snapshot.isDraggingOver
                        ? "bg-[#1DA1F2]/5 border-2 border-dashed border-[#1DA1F2]/30"
                        : ""
                    }`}
                  >
                    {tasksByStatus[column.id]?.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => openTaskModal(task)}
                            className={`${
                              snapshot.isDragging
                                ? "shadow-lg rotate-2"
                                : ""
                            }`}
                          >
                            <TaskCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Empty state */}
                    {(!tasksByStatus[column.id] ||
                      tasksByStatus[column.id].length === 0) && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        <p>No tasks</p>
                        <button
                          onClick={() => onCreateTask(column.id)}
                          className="mt-2 text-[#1DA1F2] hover:underline text-xs"
                        >
                          + Add task
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Task Detail Modal */}
      {isTaskModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          projectId={projectId}
          isOpen={isTaskModalOpen}
          onClose={closeTaskModal}
        />
      )}
    </>
  )
}
