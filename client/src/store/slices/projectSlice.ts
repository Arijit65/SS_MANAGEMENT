import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/api'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'archived'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskType = 'task' | 'bug' | 'feature' | 'improvement' | 'documentation'
export type MemberRole = 'owner' | 'manager' | 'member' | 'viewer'
export type PermissionLevel = 'view_only' | 'edit_tasks' | 'manage_project' | 'full_admin'

export interface User {
  id: string
  fullName: string
  email: string
  role: string
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: MemberRole
  permissionLevel: PermissionLevel
  canViewTasks: boolean
  canCreateTasks: boolean
  canEditTasks: boolean
  canDeleteTasks: boolean
  canManageMembers: boolean
  canManageFiles: boolean
  canEditProject: boolean
  user: User
  joinedAt: string
}

export interface TaskStats {
  total: number
  backlog: number
  todo: number
  in_progress: number
  review: number
  done: number
}

export interface Project {
  id: string
  name: string
  description?: string
  client?: string
  status: ProjectStatus
  priority: ProjectPriority
  startDate?: string
  endDate?: string
  deadline?: string
  progress: number
  budget?: number
  color: string
  tags: string[]
  settings: Record<string, unknown>
  isArchived: boolean
  createdBy: string
  creator?: User
  members?: ProjectMember[]
  taskStats?: TaskStats
  memberCount?: number
  fileCount?: number
  userPermissions?: Record<string, boolean>
  createdAt: string
  updatedAt: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface Task {
  id: string
  projectId: string
  parentTaskId?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  type: TaskType
  assigneeId?: string
  reporterId?: string
  startDate?: string
  dueDate?: string
  completedAt?: string
  estimatedHours?: number
  actualHours?: number
  order: number
  labels: string[]
  attachmentCount: number
  commentCount: number
  checklist: ChecklistItem[]
  metadata: Record<string, unknown>
  createdBy: string
  assignee?: User
  reporter?: User
  creator?: User
  subtasks?: Task[]
  parentTask?: { id: string; title: string }
  project?: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

export interface ProjectFile {
  id: string
  projectId: string
  taskId?: string
  name: string
  originalName: string
  mimeType?: string
  fileType: string
  size: number
  url: string
  thumbnailUrl?: string
  folder: string
  description?: string
  uploadedBy: string
  uploader?: User
  task?: { id: string; title: string }
  createdAt: string
}

export interface Comment {
  id: string
  projectId: string
  taskId?: string
  parentId?: string
  content: string
  authorId: string
  author?: User
  mentions: string[]
  attachments: { id: string; name: string; url: string; type: string }[]
  isEdited: boolean
  editedAt?: string
  replies?: Comment[]
  createdAt: string
}

export interface Activity {
  id: string
  projectId: string
  taskId?: string
  userId: string
  activityType: string
  description?: string
  changes: Record<string, { from: unknown; to: unknown }>
  metadata: Record<string, unknown>
  user?: User
  task?: { id: string; title: string }
  project?: { id: string; name: string }
  createdAt: string
}

export interface ProjectStats {
  projects: {
    total: number
    active: number
    completed: number
    on_hold: number
    archived: number
  }
  tasks: TaskStats
  overdueTasks: number
  recentActivity: Activity[]
  projectsByPriority: { priority: string; count: number }[]
  upcomingDeadlines: Project[]
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'task' | 'deadline'
  status?: TaskStatus
  priority?: TaskPriority
  project?: { id: string; name: string; color: string }
  projectId?: string
  projectName?: string
  assignee?: User
  color: string
}

interface ProjectState {
  // Projects
  projects: Project[]
  currentProject: Project | null
  projectsLoading: boolean
  projectLoading: boolean
  
  // Tasks
  tasks: Task[]
  tasksByStatus: Record<TaskStatus, Task[]>
  currentTask: Task | null
  tasksLoading: boolean
  taskLoading: boolean
  
  // Members
  members: ProjectMember[]
  membersLoading: boolean
  
  // Files
  files: ProjectFile[]
  filesLoading: boolean
  
  // Comments
  comments: Comment[]
  commentsLoading: boolean
  
  // Activity
  activities: Activity[]
  activitiesLoading: boolean
  
  // Stats
  stats: ProjectStats | null
  statsLoading: boolean
  
  // Calendar
  calendarEvents: CalendarEvent[]
  calendarLoading: boolean
  
  // Pagination
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  
  // Errors
  error: string | null
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  projectsLoading: false,
  projectLoading: false,
  
  tasks: [],
  tasksByStatus: {
    backlog: [],
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  },
  currentTask: null,
  tasksLoading: false,
  taskLoading: false,
  
  members: [],
  membersLoading: false,
  
  files: [],
  filesLoading: false,
  
  comments: [],
  commentsLoading: false,
  
  activities: [],
  activitiesLoading: false,
  
  stats: null,
  statsLoading: false,
  
  calendarEvents: [],
  calendarLoading: false,
  
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  },
  
  error: null,
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC THUNKS - PROJECTS
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params: {
    page?: number
    limit?: number
    status?: ProjectStatus
    priority?: ProjectPriority
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    archived?: boolean
  } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/projects', { params })
      return data.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch projects')
    }
  }
)

export const fetchProjectStats = createAsyncThunk(
  'projects/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/projects/stats')
      return data.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch stats')
    }
  }
)

export const fetchProject = createAsyncThunk(
  'projects/fetchProject',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/${id}`)
      return data.data.project
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch project')
    }
  }
)

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData: Partial<Project> & { members?: { userId: string; role?: MemberRole; permissionLevel?: PermissionLevel }[] }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/projects', projectData)
      return data.data.project
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to create project')
    }
  }
)

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, ...updates }: Partial<Project> & { id: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/projects/${id}`, updates)
      return data.data.project
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update project')
    }
  }
)

export const archiveProject = createAsyncThunk(
  'projects/archiveProject',
  async ({ id, archive }: { id: string; archive: boolean }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/projects/${id}/archive`, { archive })
      return { id, isArchived: archive }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to archive project')
    }
  }
)

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/projects/${id}`)
      return id
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to delete project')
    }
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC THUNKS - TASKS
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchTasks = createAsyncThunk(
  'projects/fetchTasks',
  async ({ projectId, ...params }: {
    projectId: string
    status?: TaskStatus
    priority?: TaskPriority
    assigneeId?: string
    search?: string
  }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/tasks`, { params })
      return data.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch tasks')
    }
  }
)

export const fetchTask = createAsyncThunk(
  'projects/fetchTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/tasks/${taskId}`)
      return data.data.task
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch task')
    }
  }
)

export const createTask = createAsyncThunk(
  'projects/createTask',
  async ({ projectId, ...taskData }: Partial<Task> & { projectId: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/projects/${projectId}/tasks`, taskData)
      return data.data.task
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to create task')
    }
  }
)

export const updateTask = createAsyncThunk(
  'projects/updateTask',
  async ({ taskId, ...updates }: Partial<Task> & { taskId: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/projects/tasks/${taskId}`, updates)
      return data.data.task
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update task')
    }
  }
)

export const updateTaskStatus = createAsyncThunk(
  'projects/updateTaskStatus',
  async ({ taskId, status, order }: { taskId: string; status: TaskStatus; order?: number }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/projects/tasks/${taskId}/status`, { status, order })
      return { taskId, status, order }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update task status')
    }
  }
)

export const reorderTasks = createAsyncThunk(
  'projects/reorderTasks',
  async (tasks: { id: string; status?: TaskStatus; order: number }[], { rejectWithValue }) => {
    try {
      await api.put('/projects/tasks/reorder', { tasks })
      return tasks
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to reorder tasks')
    }
  }
)

export const deleteTask = createAsyncThunk(
  'projects/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/projects/tasks/${taskId}`)
      return taskId
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to delete task')
    }
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC THUNKS - MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchMembers = createAsyncThunk(
  'projects/fetchMembers',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/members`)
      return data.data.members
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch members')
    }
  }
)

export const addMember = createAsyncThunk(
  'projects/addMember',
  async ({ projectId, ...memberData }: {
    projectId: string
    userId: string
    role?: MemberRole
    permissionLevel?: PermissionLevel
  }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, memberData)
      return data.data.member
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to add member')
    }
  }
)

export const updateMember = createAsyncThunk(
  'projects/updateMember',
  async ({ projectId, userId, ...updates }: {
    projectId: string
    userId: string
    role?: MemberRole
    permissionLevel?: PermissionLevel
  }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/projects/${projectId}/members/${userId}`, updates)
      return data.data.member
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update member')
    }
  }
)

export const removeMember = createAsyncThunk(
  'projects/removeMember',
  async ({ projectId, userId }: { projectId: string; userId: string }, { rejectWithValue }) => {
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`)
      return userId
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to remove member')
    }
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC THUNKS - FILES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchFiles = createAsyncThunk(
  'projects/fetchFiles',
  async ({ projectId, ...params }: {
    projectId: string
    taskId?: string
    folder?: string
    fileType?: string
  }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/files`, { params })
      return data.data.files
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch files')
    }
  }
)

export const uploadFile = createAsyncThunk(
  'projects/uploadFile',
  async ({ projectId, ...fileData }: {
    projectId: string
    taskId?: string
    folder?: string
    description?: string
    url: string
    originalName: string
    mimeType?: string
    size: number
    cloudinaryId?: string
    thumbnailUrl?: string
  }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/projects/${projectId}/files`, fileData)
      return data.data.file
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to upload file')
    }
  }
)

export const deleteFile = createAsyncThunk(
  'projects/deleteFile',
  async (fileId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/projects/files/${fileId}`)
      return fileId
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to delete file')
    }
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC THUNKS - COMMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchComments = createAsyncThunk(
  'projects/fetchComments',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/tasks/${taskId}/comments`)
      return data.data.comments
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch comments')
    }
  }
)

export const addComment = createAsyncThunk(
  'projects/addComment',
  async ({ taskId, ...commentData }: {
    taskId: string
    content: string
    parentId?: string
    mentions?: string[]
  }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/projects/tasks/${taskId}/comments`, commentData)
      return data.data.comment
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to add comment')
    }
  }
)

export const updateComment = createAsyncThunk(
  'projects/updateComment',
  async ({ commentId, content }: { commentId: string; content: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/projects/comments/${commentId}`, { content })
      return data.data.comment
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update comment')
    }
  }
)

export const deleteComment = createAsyncThunk(
  'projects/deleteComment',
  async (commentId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/projects/comments/${commentId}`)
      return commentId
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to delete comment')
    }
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC THUNKS - ACTIVITY
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchActivity = createAsyncThunk(
  'projects/fetchActivity',
  async ({ projectId, ...params }: {
    projectId: string
    page?: number
    limit?: number
    activityType?: string
    taskId?: string
  }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/activity`, { params })
      return data.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch activity')
    }
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC THUNKS - CALENDAR
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchCalendarEvents = createAsyncThunk(
  'projects/fetchCalendarEvents',
  async (params: { start?: string; end?: string } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/projects/calendar', { params })
      return data.data.events
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch calendar')
    }
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
// SLICE
// ═══════════════════════════════════════════════════════════════════════════════

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
    clearCurrentProject(state) {
      state.currentProject = null
      state.tasks = []
      state.tasksByStatus = {
        backlog: [],
        todo: [],
        in_progress: [],
        review: [],
        done: [],
      }
      state.members = []
      state.files = []
      state.activities = []
    },
    clearCurrentTask(state) {
      state.currentTask = null
      state.comments = []
    },
    setTasksByStatus(state, action: PayloadAction<Record<TaskStatus, Task[]>>) {
      state.tasksByStatus = action.payload
    },
    optimisticUpdateTaskStatus(state, action: PayloadAction<{ taskId: string; status: TaskStatus; order?: number }>) {
      const { taskId, status, order } = action.payload
      
      // Find and update task in tasks array
      const taskIndex = state.tasks.findIndex(t => t.id === taskId)
      if (taskIndex !== -1) {
        const task = state.tasks[taskIndex]
        const oldStatus = task.status
        
        // Remove from old status
        state.tasksByStatus[oldStatus] = state.tasksByStatus[oldStatus].filter(t => t.id !== taskId)
        
        // Update task
        task.status = status
        if (order !== undefined) task.order = order
        
        // Add to new status
        state.tasksByStatus[status].push(task)
        state.tasksByStatus[status].sort((a, b) => a.order - b.order)
      }
    },
  },
  extraReducers: (builder) => {
    // ─── Projects ──────────────────────────────────────────────────────────────
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.projectsLoading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projectsLoading = false
        state.projects = action.payload.projects
        state.pagination = action.payload.pagination
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.projectsLoading = false
        state.error = action.payload as string
      })
      
      .addCase(fetchProjectStats.pending, (state) => {
        state.statsLoading = true
      })
      .addCase(fetchProjectStats.fulfilled, (state, action) => {
        state.statsLoading = false
        state.stats = action.payload
      })
      .addCase(fetchProjectStats.rejected, (state, action) => {
        state.statsLoading = false
        state.error = action.payload as string
      })
      
      .addCase(fetchProject.pending, (state) => {
        state.projectLoading = true
        state.error = null
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.projectLoading = false
        state.currentProject = action.payload
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.projectLoading = false
        state.error = action.payload as string
      })
      
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload)
      })
      
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.id)
        if (index !== -1) state.projects[index] = action.payload
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload
        }
      })
      
      .addCase(archiveProject.fulfilled, (state, action) => {
        const { id, isArchived } = action.payload
        const index = state.projects.findIndex(p => p.id === id)
        if (index !== -1) state.projects[index].isArchived = isArchived
        if (state.currentProject?.id === id) {
          state.currentProject.isArchived = isArchived
        }
      })
      
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload)
      })
    
    // ─── Tasks ──────────────────────────────────────────────────────────────────
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.tasksLoading = true
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasksLoading = false
        state.tasks = action.payload.tasks
        state.tasksByStatus = action.payload.tasksByStatus
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.tasksLoading = false
        state.error = action.payload as string
      })
      
      .addCase(fetchTask.pending, (state) => {
        state.taskLoading = true
      })
      .addCase(fetchTask.fulfilled, (state, action) => {
        state.taskLoading = false
        state.currentTask = action.payload
      })
      .addCase(fetchTask.rejected, (state, action) => {
        state.taskLoading = false
        state.error = action.payload as string
      })
      
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload)
        const status = action.payload.status as TaskStatus
        state.tasksByStatus[status].push(action.payload)
      })
      
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id)
        if (index !== -1) state.tasks[index] = action.payload
        
        // Update in tasksByStatus
        Object.keys(state.tasksByStatus).forEach(status => {
          const idx = state.tasksByStatus[status as TaskStatus].findIndex(t => t.id === action.payload.id)
          if (idx !== -1) {
            if (action.payload.status === status) {
              state.tasksByStatus[status as TaskStatus][idx] = action.payload
            } else {
              state.tasksByStatus[status as TaskStatus].splice(idx, 1)
              state.tasksByStatus[action.payload.status as TaskStatus].push(action.payload)
            }
          }
        })
        
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload
        }
      })
      
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t.id !== action.payload)
        Object.keys(state.tasksByStatus).forEach(status => {
          state.tasksByStatus[status as TaskStatus] = state.tasksByStatus[status as TaskStatus].filter(t => t.id !== action.payload)
        })
      })
    
    // ─── Members ────────────────────────────────────────────────────────────────
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.membersLoading = true
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.membersLoading = false
        state.members = action.payload
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.membersLoading = false
        state.error = action.payload as string
      })
      
      .addCase(addMember.fulfilled, (state, action) => {
        state.members.push(action.payload)
      })
      
      .addCase(updateMember.fulfilled, (state, action) => {
        const index = state.members.findIndex(m => m.id === action.payload.id)
        if (index !== -1) state.members[index] = action.payload
      })
      
      .addCase(removeMember.fulfilled, (state, action) => {
        state.members = state.members.filter(m => m.userId !== action.payload)
      })
    
    // ─── Files ──────────────────────────────────────────────────────────────────
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.filesLoading = true
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.filesLoading = false
        state.files = action.payload
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.filesLoading = false
        state.error = action.payload as string
      })
      
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.files.unshift(action.payload)
      })
      
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter(f => f.id !== action.payload)
      })
    
    // ─── Comments ───────────────────────────────────────────────────────────────
    builder
      .addCase(fetchComments.pending, (state) => {
        state.commentsLoading = true
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.commentsLoading = false
        state.comments = action.payload
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.commentsLoading = false
        state.error = action.payload as string
      })
      
      .addCase(addComment.fulfilled, (state, action) => {
        if (action.payload.parentId) {
          const parent = state.comments.find(c => c.id === action.payload.parentId)
          if (parent) {
            parent.replies = parent.replies || []
            parent.replies.push(action.payload)
          }
        } else {
          state.comments.unshift(action.payload)
        }
      })
      
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter(c => c.id !== action.payload)
      })
    
    // ─── Activity ───────────────────────────────────────────────────────────────
    builder
      .addCase(fetchActivity.pending, (state) => {
        state.activitiesLoading = true
      })
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.activitiesLoading = false
        state.activities = action.payload.activities
      })
      .addCase(fetchActivity.rejected, (state, action) => {
        state.activitiesLoading = false
        state.error = action.payload as string
      })
    
    // ─── Calendar ───────────────────────────────────────────────────────────────
    builder
      .addCase(fetchCalendarEvents.pending, (state) => {
        state.calendarLoading = true
      })
      .addCase(fetchCalendarEvents.fulfilled, (state, action) => {
        state.calendarLoading = false
        state.calendarEvents = action.payload
      })
      .addCase(fetchCalendarEvents.rejected, (state, action) => {
        state.calendarLoading = false
        state.error = action.payload as string
      })
  },
})

export const {
  clearError,
  clearCurrentProject,
  clearCurrentTask,
  setTasksByStatus,
  optimisticUpdateTaskStatus,
} = projectSlice.actions

export default projectSlice.reducer
