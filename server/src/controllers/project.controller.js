const { Op } = require('sequelize');
const {
  Project,
  ProjectTask,
  ProjectMember,
  ProjectFile,
  ProjectComment,
  ProjectActivity,
  User,
  sequelize,
} = require('../models');

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Check if user can access project
const canAccessProject = async (userId, projectId, userRole) => {
  // Admin can access all projects
  if (userRole === 'admin') return { canAccess: true, role: 'admin', permissions: 'full' };
  
  // Check if user is a member of the project
  const membership = await ProjectMember.findOne({
    where: { projectId, userId },
  });
  
  if (!membership) return { canAccess: false };
  
  return {
    canAccess: true,
    role: membership.role,
    permissionLevel: membership.permissionLevel,
    permissions: {
      canViewTasks: membership.canViewTasks,
      canCreateTasks: membership.canCreateTasks,
      canEditTasks: membership.canEditTasks,
      canDeleteTasks: membership.canDeleteTasks,
      canManageMembers: membership.canManageMembers,
      canManageFiles: membership.canManageFiles,
      canEditProject: membership.canEditProject,
    },
  };
};

// Log activity
const logActivity = async (data) => {
  try {
    await ProjectActivity.create(data);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Calculate project progress based on tasks
const calculateProgress = async (projectId) => {
  const tasks = await ProjectTask.findAll({
    where: { projectId },
    attributes: ['status'],
  });
  
  if (tasks.length === 0) return 0;
  
  const completed = tasks.filter(t => t.status === 'done').length;
  return Math.round((completed / tasks.length) * 100);
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// Get all projects (with filtering, sorting, pagination)
exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      archived = 'false',
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const where = {
      isArchived: archived === 'true',
    };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { client: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    // For non-admin users, only show projects they're a member of
    let projectIds = null;
    if (userRole !== 'admin') {
      const memberships = await ProjectMember.findAll({
        where: { userId },
        attributes: ['projectId'],
      });
      projectIds = memberships.map(m => m.projectId);
      where.id = { [Op.in]: projectIds };
    }
    
    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email', 'role'],
        },
        {
          model: ProjectMember,
          as: 'members',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'role'],
          }],
          limit: 5, // Only show first 5 members in list
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });
    
    // Get task counts for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskStats = await ProjectTask.findAll({
          where: { projectId: project.id },
          attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          ],
          group: ['status'],
          raw: true,
        });
        
        const stats = {
          total: 0,
          backlog: 0,
          todo: 0,
          in_progress: 0,
          review: 0,
          done: 0,
        };
        
        taskStats.forEach(s => {
          stats[s.status] = parseInt(s.count);
          stats.total += parseInt(s.count);
        });
        
        return {
          ...project.toJSON(),
          taskStats: stats,
          memberCount: await ProjectMember.count({ where: { projectId: project.id } }),
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        projects: projectsWithStats,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message,
    });
  }
};

// Get project statistics for dashboard
exports.getProjectStats = async (req, res) => {
  try {
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    // Get accessible project IDs
    let projectFilter = {};
    if (userRole !== 'admin') {
      const memberships = await ProjectMember.findAll({
        where: { userId },
        attributes: ['projectId'],
      });
      projectFilter = { id: { [Op.in]: memberships.map(m => m.projectId) } };
    }
    
    // Project counts by status
    const projectStats = await Project.findAll({
      where: { ...projectFilter, isArchived: false },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });
    
    const stats = {
      total: 0,
      active: 0,
      completed: 0,
      on_hold: 0,
      archived: 0,
    };
    
    projectStats.forEach(s => {
      stats[s.status] = parseInt(s.count);
      stats.total += parseInt(s.count);
    });
    
    // Get archived count separately
    const archivedCount = await Project.count({
      where: { ...projectFilter, isArchived: true },
    });
    stats.archived = archivedCount;
    
    // Task statistics
    const taskProjectFilter = userRole !== 'admin'
      ? { projectId: { [Op.in]: Object.values(projectFilter)[0]?.[Op.in] || [] } }
      : {};
    
    const taskStats = await ProjectTask.findAll({
      where: taskProjectFilter,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });
    
    const tasks = {
      total: 0,
      backlog: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };
    
    taskStats.forEach(s => {
      tasks[s.status] = parseInt(s.count);
      tasks.total += parseInt(s.count);
    });
    
    // Overdue tasks
    const overdueTasks = await ProjectTask.count({
      where: {
        ...taskProjectFilter,
        status: { [Op.notIn]: ['done'] },
        dueDate: { [Op.lt]: new Date() },
      },
    });
    
    // Recent activity
    const recentActivity = await ProjectActivity.findAll({
      where: userRole !== 'admin' ? { projectId: { [Op.in]: Object.values(projectFilter)[0]?.[Op.in] || [] } } : {},
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
    
    // Projects by priority
    const projectsByPriority = await Project.findAll({
      where: { ...projectFilter, isArchived: false },
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['priority'],
      raw: true,
    });
    
    // Upcoming deadlines
    const upcomingDeadlines = await Project.findAll({
      where: {
        ...projectFilter,
        isArchived: false,
        deadline: {
          [Op.gte]: new Date(),
          [Op.lte]: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Next 14 days
        },
      },
      order: [['deadline', 'ASC']],
      limit: 5,
    });
    
    res.json({
      success: true,
      data: {
        projects: stats,
        tasks,
        overdueTasks,
        recentActivity,
        projectsByPriority,
        upcomingDeadlines,
      },
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

// Get single project with details
exports.getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    // Check access
    const access = await canAccessProject(userId, id, userRole);
    if (!access.canAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project',
      });
    }
    
    const project = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email', 'role'],
        },
        {
          model: ProjectMember,
          as: 'members',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'role'],
          }],
        },
      ],
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    
    // Get task counts
    const taskStats = await ProjectTask.findAll({
      where: { projectId: id },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });
    
    const stats = {
      total: 0,
      backlog: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };
    
    taskStats.forEach(s => {
      stats[s.status] = parseInt(s.count);
      stats.total += parseInt(s.count);
    });
    
    // File count
    const fileCount = await ProjectFile.count({ where: { projectId: id } });
    
    res.json({
      success: true,
      data: {
        project: {
          ...project.toJSON(),
          taskStats: stats,
          fileCount,
          userPermissions: access.permissions,
        },
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message,
    });
  }
};

// Create project
exports.createProject = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.sub;
    const {
      name,
      description,
      client,
      status,
      priority,
      startDate,
      endDate,
      deadline,
      budget,
      color,
      tags,
      members = [],
    } = req.body;
    
    // Create project
    const project = await Project.create(
      {
        name,
        description,
        client,
        status: status || 'active',
        priority: priority || 'medium',
        startDate,
        endDate,
        deadline,
        budget,
        color,
        tags,
        createdBy: userId,
      },
      { transaction }
    );
    
    // Add creator as owner
    await ProjectMember.create(
      {
        projectId: project.id,
        userId,
        role: 'owner',
        permissionLevel: 'full_admin',
        ...ProjectMember.setPermissionsFromLevel('full_admin'),
        addedBy: userId,
      },
      { transaction }
    );
    
    // Add other members if provided
    if (members.length > 0) {
      const memberRecords = members.map(m => ({
        projectId: project.id,
        userId: m.userId,
        role: m.role || 'member',
        permissionLevel: m.permissionLevel || 'edit_tasks',
        ...ProjectMember.setPermissionsFromLevel(m.permissionLevel || 'edit_tasks'),
        addedBy: userId,
      }));
      
      await ProjectMember.bulkCreate(memberRecords, { transaction });
    }
    
    // Log activity
    await ProjectActivity.create(
      {
        projectId: project.id,
        userId,
        activityType: 'project_created',
        description: `Created project "${name}"`,
        metadata: { projectName: name },
      },
      { transaction }
    );
    
    await transaction.commit();
    
    // Fetch complete project with relations
    const completeProject = await Project.findByPk(project.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email', 'role'],
        },
        {
          model: ProjectMember,
          as: 'members',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'role'],
          }],
        },
      ],
    });
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project: completeProject },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message,
    });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    // Check access
    const access = await canAccessProject(userId, id, userRole);
    if (!access.canAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project',
      });
    }
    
    if (userRole !== 'admin' && !access.permissions?.canEditProject) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this project',
      });
    }
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    
    const allowedFields = [
      'name', 'description', 'client', 'status', 'priority',
      'startDate', 'endDate', 'deadline', 'budget', 'color', 'tags', 'settings',
    ];
    
    const updates = {};
    const changes = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== project[field]) {
        changes[field] = { from: project[field], to: req.body[field] };
        updates[field] = req.body[field];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.json({
        success: true,
        message: 'No changes to update',
        data: { project },
      });
    }
    
    await project.update(updates, { transaction });
    
    // Log activity
    await ProjectActivity.create(
      {
        projectId: id,
        userId,
        activityType: 'project_updated',
        description: `Updated project "${project.name}"`,
        changes,
        metadata: { projectName: project.name },
      },
      { transaction }
    );
    
    await transaction.commit();
    
    const updatedProject = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email', 'role'],
        },
        {
          model: ProjectMember,
          as: 'members',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'role'],
          }],
        },
      ],
    });
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message,
    });
  }
};

// Archive/Restore project
exports.archiveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    const { archive = true } = req.body;
    
    // Check access
    const access = await canAccessProject(userId, id, userRole);
    if (!access.canAccess || (userRole !== 'admin' && access.role !== 'owner')) {
      return res.status(403).json({
        success: false,
        message: 'Only project owners and admins can archive projects',
      });
    }
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    
    await project.update({ isArchived: archive });
    
    await logActivity({
      projectId: id,
      userId,
      activityType: archive ? 'project_archived' : 'project_restored',
      description: `${archive ? 'Archived' : 'Restored'} project "${project.name}"`,
      metadata: { projectName: project.name },
    });
    
    res.json({
      success: true,
      message: `Project ${archive ? 'archived' : 'restored'} successfully`,
      data: { project },
    });
  } catch (error) {
    console.error('Archive project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive project',
      error: error.message,
    });
  }
};

// Delete project (permanent - admin only)
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can permanently delete projects',
      });
    }
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    
    await project.destroy();
    
    res.json({
      success: true,
      message: 'Project deleted permanently',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TASK CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// Get tasks for a project
exports.getTasks = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    // Check access
    const access = await canAccessProject(userId, projectId, userRole);
    if (!access.canAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project',
      });
    }
    
    const {
      status,
      priority,
      assigneeId,
      search,
      sortBy = 'order',
      sortOrder = 'asc',
    } = req.query;
    
    const where = { projectId };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    const tasks = await ProjectTask.findAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'fullName', 'email', 'role'] },
        { model: User, as: 'reporter', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName'] },
        { model: ProjectTask, as: 'subtasks', attributes: ['id', 'title', 'status'] },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
    });
    
    // Group by status for Kanban view
    const tasksByStatus = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };
    
    tasks.forEach(task => {
      if (tasksByStatus[task.status]) {
        tasksByStatus[task.status].push(task);
      }
    });
    
    res.json({
      success: true,
      data: {
        tasks,
        tasksByStatus,
        total: tasks.length,
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message,
    });
  }
};

// Get single task
exports.getTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    const task = await ProjectTask.findByPk(taskId, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'fullName', 'email', 'role'] },
        { model: User, as: 'reporter', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName'] },
        { model: ProjectTask, as: 'subtasks' },
        { model: ProjectTask, as: 'parentTask', attributes: ['id', 'title'] },
        { model: ProjectFile, as: 'attachments' },
        {
          model: ProjectComment,
          as: 'comments',
          include: [{ model: User, as: 'author', attributes: ['id', 'fullName'] }],
          where: { isDeleted: false },
          required: false,
        },
      ],
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }
    
    // Check access
    const access = await canAccessProject(userId, task.projectId, userRole);
    if (!access.canAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this task',
      });
    }
    
    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: error.message,
    });
  }
};

// Create task
exports.createTask = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id: projectId } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    // Check access
    const access = await canAccessProject(userId, projectId, userRole);
    if (!access.canAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project',
      });
    }
    
    if (userRole !== 'admin' && !access.permissions?.canCreateTasks) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create tasks',
      });
    }
    
    const {
      title,
      description,
      status,
      priority,
      type,
      assigneeId,
      parentTaskId,
      startDate,
      dueDate,
      estimatedHours,
      labels,
      checklist,
    } = req.body;
    
    // Get max order for the status
    const maxOrder = await ProjectTask.max('order', {
      where: { projectId, status: status || 'todo' },
    });
    
    const task = await ProjectTask.create(
      {
        projectId,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        type: type || 'task',
        assigneeId,
        reporterId: userId,
        parentTaskId,
        startDate,
        dueDate,
        estimatedHours,
        labels,
        checklist,
        order: (maxOrder || 0) + 1,
        createdBy: userId,
      },
      { transaction }
    );
    
    // Log activity
    await ProjectActivity.create(
      {
        projectId,
        taskId: task.id,
        userId,
        activityType: 'task_created',
        description: `Created task "${title}"`,
        metadata: { taskTitle: title },
      },
      { transaction }
    );
    
    await transaction.commit();
    
    // Fetch complete task
    const completeTask = await ProjectTask.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'fullName', 'email', 'role'] },
        { model: User, as: 'reporter', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      ],
    });
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: completeTask },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message,
    });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { taskId } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    const task = await ProjectTask.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }
    
    // Check access
    const access = await canAccessProject(userId, task.projectId, userRole);
    if (!access.canAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project',
      });
    }
    
    if (userRole !== 'admin' && !access.permissions?.canEditTasks) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit tasks',
      });
    }
    
    const allowedFields = [
      'title', 'description', 'status', 'priority', 'type',
      'assigneeId', 'parentTaskId', 'startDate', 'dueDate',
      'estimatedHours', 'actualHours', 'labels', 'checklist', 'metadata',
    ];
    
    const updates = {};
    const changes = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        const oldValue = task[field];
        const newValue = req.body[field];
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes[field] = { from: oldValue, to: newValue };
          updates[field] = newValue;
        }
      }
    });
    
    // Handle status change
    if (updates.status === 'done' && task.status !== 'done') {
      updates.completedAt = new Date();
    } else if (updates.status && updates.status !== 'done' && task.status === 'done') {
      updates.completedAt = null;
    }
    
    if (Object.keys(updates).length === 0) {
      return res.json({
        success: true,
        message: 'No changes to update',
        data: { task },
      });
    }
    
    await task.update(updates, { transaction });
    
    // Determine activity type
    let activityType = 'task_updated';
    if (changes.status) {
      activityType = changes.status.to === 'done' ? 'task_completed' : 'task_status_changed';
    } else if (changes.assigneeId) {
      activityType = 'task_assigned';
    }
    
    // Log activity
    await ProjectActivity.create(
      {
        projectId: task.projectId,
        taskId: task.id,
        userId,
        activityType,
        description: `Updated task "${task.title}"`,
        changes,
        metadata: { taskTitle: task.title },
      },
      { transaction }
    );
    
    // Update project progress if status changed
    if (changes.status) {
      const progress = await calculateProgress(task.projectId);
      await Project.update({ progress }, { where: { id: task.projectId }, transaction });
    }
    
    await transaction.commit();
    
    const updatedTask = await ProjectTask.findByPk(taskId, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'fullName', 'email', 'role'] },
        { model: User, as: 'reporter', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      ],
    });
    
    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task: updatedTask },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message,
    });
  }
};

// Update task status (for Kanban drag)
exports.updateTaskStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { taskId } = req.params;
    const { status, order } = req.body;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    const task = await ProjectTask.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }
    
    // Check access
    const access = await canAccessProject(userId, task.projectId, userRole);
    if (!access.canAccess || (userRole !== 'admin' && !access.permissions?.canEditTasks)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this task',
      });
    }
    
    const oldStatus = task.status;
    const updates = { status };
    
    if (order !== undefined) {
      updates.order = order;
    }
    
    if (status === 'done' && oldStatus !== 'done') {
      updates.completedAt = new Date();
    } else if (status !== 'done' && oldStatus === 'done') {
      updates.completedAt = null;
    }
    
    await task.update(updates, { transaction });
    
    // Log activity
    await ProjectActivity.create(
      {
        projectId: task.projectId,
        taskId: task.id,
        userId,
        activityType: status === 'done' ? 'task_completed' : 'task_status_changed',
        description: `Moved task "${task.title}" from ${oldStatus} to ${status}`,
        changes: { status: { from: oldStatus, to: status } },
        metadata: { taskTitle: task.title },
      },
      { transaction }
    );
    
    // Update project progress
    const progress = await calculateProgress(task.projectId);
    await Project.update({ progress }, { where: { id: task.projectId }, transaction });
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Task status updated',
      data: { task },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: error.message,
    });
  }
};

// Reorder tasks (batch update)
exports.reorderTasks = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { tasks } = req.body; // Array of { id, status, order }
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tasks array is required',
      });
    }
    
    // Get the project ID from first task
    const firstTask = await ProjectTask.findByPk(tasks[0].id);
    if (!firstTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }
    
    // Check access
    const access = await canAccessProject(userId, firstTask.projectId, userRole);
    if (!access.canAccess || (userRole !== 'admin' && !access.permissions?.canEditTasks)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reorder tasks',
      });
    }
    
    // Update each task
    for (const taskData of tasks) {
      const updates = { order: taskData.order };
      if (taskData.status) {
        updates.status = taskData.status;
        
        // Handle completion status
        const task = await ProjectTask.findByPk(taskData.id);
        if (task) {
          if (taskData.status === 'done' && task.status !== 'done') {
            updates.completedAt = new Date();
          } else if (taskData.status !== 'done' && task.status === 'done') {
            updates.completedAt = null;
          }
        }
      }
      
      await ProjectTask.update(updates, {
        where: { id: taskData.id },
        transaction,
      });
    }
    
    // Update project progress
    const progress = await calculateProgress(firstTask.projectId);
    await Project.update({ progress }, { where: { id: firstTask.projectId }, transaction });
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Tasks reordered successfully',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Reorder tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder tasks',
      error: error.message,
    });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    const task = await ProjectTask.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }
    
    // Check access
    const access = await canAccessProject(userId, task.projectId, userRole);
    if (!access.canAccess || (userRole !== 'admin' && !access.permissions?.canDeleteTasks)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete tasks',
      });
    }
    
    const taskTitle = task.title;
    const projectId = task.projectId;
    
    await task.destroy();
    
    // Log activity
    await logActivity({
      projectId,
      userId,
      activityType: 'task_deleted',
      description: `Deleted task "${taskTitle}"`,
      metadata: { taskTitle },
    });
    
    // Update project progress
    const progress = await calculateProgress(projectId);
    await Project.update({ progress }, { where: { id: projectId } });
    
    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// Get project members
exports.getMembers = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    // Check access
    const access = await canAccessProject(userId, projectId, userRole);
    if (!access.canAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project',
      });
    }
    
    const members = await ProjectMember.findAll({
      where: { projectId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'fullName', 'email', 'role', 'isActive'],
      }],
      order: [['joinedAt', 'ASC']],
    });
    
    res.json({
      success: true,
      data: { members },
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message,
    });
  }
};

// Add member to project
exports.addMember = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { userId: targetUserId, role, permissionLevel } = req.body;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    // Check access
    const access = await canAccessProject(userId, projectId, userRole);
    if (!access.canAccess || (userRole !== 'admin' && !access.permissions?.canManageMembers)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to manage members',
      });
    }
    
    // Check if already a member
    const existing = await ProjectMember.findOne({
      where: { projectId, userId: targetUserId },
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }
    
    // Get user details
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    const member = await ProjectMember.create({
      projectId,
      userId: targetUserId,
      role: role || 'member',
      permissionLevel: permissionLevel || 'edit_tasks',
      ...ProjectMember.setPermissionsFromLevel(permissionLevel || 'edit_tasks'),
      addedBy: userId,
    });
    
    // Log activity
    await logActivity({
      projectId,
      userId,
      activityType: 'member_added',
      description: `Added ${targetUser.fullName} to the project`,
      metadata: { memberName: targetUser.fullName, memberRole: role || 'member' },
    });
    
    const completeMember = await ProjectMember.findByPk(member.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'fullName', 'email', 'role'],
      }],
    });
    
    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: { member: completeMember },
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add member',
      error: error.message,
    });
  }
};

// Update member permissions
exports.updateMember = async (req, res) => {
  try {
    const { id: projectId, userId: targetUserId } = req.params;
    const { role, permissionLevel, ...permissions } = req.body;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    // Check access
    const access = await canAccessProject(userId, projectId, userRole);
    if (!access.canAccess || (userRole !== 'admin' && !access.permissions?.canManageMembers)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to manage members',
      });
    }
    
    const member = await ProjectMember.findOne({
      where: { projectId, userId: targetUserId },
    });
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }
    
    // Cannot change owner's role unless you're admin
    if (member.role === 'owner' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify project owner permissions',
      });
    }
    
    const updates = {};
    if (role) updates.role = role;
    if (permissionLevel) {
      updates.permissionLevel = permissionLevel;
      Object.assign(updates, ProjectMember.setPermissionsFromLevel(permissionLevel));
    }
    
    // Allow individual permission overrides
    ['canViewTasks', 'canCreateTasks', 'canEditTasks', 'canDeleteTasks', 
     'canManageMembers', 'canManageFiles', 'canEditProject'].forEach(perm => {
      if (permissions[perm] !== undefined) {
        updates[perm] = permissions[perm];
      }
    });
    
    await member.update(updates);
    
    // Log activity
    const targetUser = await User.findByPk(targetUserId);
    await logActivity({
      projectId,
      userId,
      activityType: 'member_role_changed',
      description: `Updated ${targetUser?.fullName}'s permissions`,
      metadata: { memberName: targetUser?.fullName },
    });
    
    const updatedMember = await ProjectMember.findByPk(member.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'fullName', 'email', 'role'],
      }],
    });
    
    res.json({
      success: true,
      message: 'Member updated successfully',
      data: { member: updatedMember },
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member',
      error: error.message,
    });
  }
};

// Remove member from project
exports.removeMember = async (req, res) => {
  try {
    const { id: projectId, userId: targetUserId } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    // Check access
    const access = await canAccessProject(userId, projectId, userRole);
    if (!access.canAccess || (userRole !== 'admin' && !access.permissions?.canManageMembers)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to manage members',
      });
    }
    
    const member = await ProjectMember.findOne({
      where: { projectId, userId: targetUserId },
      include: [{ model: User, as: 'user' }],
    });
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }
    
    // Cannot remove owner
    if (member.role === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove project owner',
      });
    }
    
    const memberName = member.user?.fullName;
    await member.destroy();
    
    // Log activity
    await logActivity({
      projectId,
      userId,
      activityType: 'member_removed',
      description: `Removed ${memberName} from the project`,
      metadata: { memberName },
    });
    
    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Get comments for a task
exports.getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const comments = await ProjectComment.findAll({
      where: { taskId, isDeleted: false, parentId: null },
      include: [
        { model: User, as: 'author', attributes: ['id', 'fullName', 'email'] },
        {
          model: ProjectComment,
          as: 'replies',
          where: { isDeleted: false },
          required: false,
          include: [{ model: User, as: 'author', attributes: ['id', 'fullName', 'email'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    res.json({
      success: true,
      data: { comments },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message,
    });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, parentId, mentions, attachments } = req.body;
    const userId = req.user.sub;
    
    const task = await ProjectTask.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }
    
    const comment = await ProjectComment.create({
      projectId: task.projectId,
      taskId,
      parentId,
      content,
      authorId: userId,
      mentions: mentions || [],
      attachments: attachments || [],
    });
    
    // Update task comment count
    await task.increment('commentCount');
    
    // Log activity
    await logActivity({
      projectId: task.projectId,
      taskId,
      userId,
      activityType: 'comment_added',
      description: `Added a comment on "${task.title}"`,
      metadata: { taskTitle: task.title },
    });
    
    const completeComment = await ProjectComment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'fullName', 'email'] }],
    });
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment: completeComment },
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message,
    });
  }
};

// Update comment
exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.sub;
    
    const comment = await ProjectComment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }
    
    // Only author can edit
    if (comment.authorId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments',
      });
    }
    
    await comment.update({
      content,
      isEdited: true,
      editedAt: new Date(),
    });
    
    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment },
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message,
    });
  }
};

// Delete comment (soft delete)
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.sub;
    
    const comment = await ProjectComment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }
    
    // Only author or admin can delete
    if (comment.authorId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments',
      });
    }
    
    await comment.update({ isDeleted: true });
    
    // Update task comment count
    if (comment.taskId) {
      await ProjectTask.decrement('commentCount', { where: { id: comment.taskId } });
    }
    
    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FILES
// ═══════════════════════════════════════════════════════════════════════════════

// Get project files
exports.getFiles = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { taskId, folder, fileType } = req.query;
    
    const where = { projectId };
    if (taskId) where.taskId = taskId;
    if (folder) where.folder = folder;
    if (fileType) where.fileType = fileType;
    
    const files = await ProjectFile.findAll({
      where,
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'fullName'] },
        { model: ProjectTask, as: 'task', attributes: ['id', 'title'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    res.json({
      success: true,
      data: { files },
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files',
      error: error.message,
    });
  }
};

// Upload file (metadata only - actual upload handled by Cloudinary middleware)
exports.uploadFile = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { taskId, folder, description, url, originalName, mimeType, size, cloudinaryId, thumbnailUrl } = req.body;
    const userId = req.user.sub;
    
    const file = await ProjectFile.create({
      projectId,
      taskId,
      name: originalName,
      originalName,
      mimeType,
      fileType: ProjectFile.getFileType(mimeType),
      size,
      url,
      thumbnailUrl,
      cloudinaryId,
      folder: folder || 'root',
      description,
      uploadedBy: userId,
    });
    
    // Update task attachment count if applicable
    if (taskId) {
      await ProjectTask.increment('attachmentCount', { where: { id: taskId } });
    }
    
    // Log activity
    await logActivity({
      projectId,
      taskId,
      userId,
      activityType: 'file_uploaded',
      description: `Uploaded file "${originalName}"`,
      metadata: { fileName: originalName },
    });
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { file },
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message,
    });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    const file = await ProjectFile.findByPk(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }
    
    // Check access
    const access = await canAccessProject(userId, file.projectId, userRole);
    if (!access.canAccess || (userRole !== 'admin' && !access.permissions?.canManageFiles)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete files',
      });
    }
    
    const fileName = file.originalName;
    const projectId = file.projectId;
    const taskId = file.taskId;
    
    // TODO: Delete from Cloudinary if needed
    
    await file.destroy();
    
    // Update task attachment count if applicable
    if (taskId) {
      await ProjectTask.decrement('attachmentCount', { where: { id: taskId } });
    }
    
    // Log activity
    await logActivity({
      projectId,
      taskId,
      userId,
      activityType: 'file_deleted',
      description: `Deleted file "${fileName}"`,
      metadata: { fileName },
    });
    
    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY LOG
// ═══════════════════════════════════════════════════════════════════════════════

// Get project activity
exports.getActivity = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { page = 1, limit = 20, activityType, taskId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = { projectId };
    if (activityType) where.activityType = activityType;
    if (taskId) where.taskId = taskId;
    
    const { count, rows: activities } = await ProjectActivity.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email'] },
        { model: ProjectTask, as: 'task', attributes: ['id', 'title'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });
    
    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity',
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINE & CALENDAR
// ═══════════════════════════════════════════════════════════════════════════════

// Get timeline data (for Gantt chart)
exports.getTimeline = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    // Check access
    const access = await canAccessProject(userId, projectId, userRole);
    if (!access.canAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project',
      });
    }
    
    const project = await Project.findByPk(projectId, {
      attributes: ['id', 'name', 'startDate', 'endDate', 'deadline'],
    });
    
    const tasks = await ProjectTask.findAll({
      where: { projectId },
      attributes: ['id', 'title', 'status', 'priority', 'startDate', 'dueDate', 'parentTaskId', 'assigneeId'],
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'fullName'] },
      ],
      order: [['startDate', 'ASC'], ['dueDate', 'ASC']],
    });
    
    res.json({
      success: true,
      data: {
        project,
        tasks,
      },
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timeline',
      error: error.message,
    });
  }
};

// Get calendar data
exports.getCalendar = async (req, res) => {
  try {
    const userId = req.user.sub;
    const userRole = req.user.role;
    const { start, end } = req.query;
    
    // Get accessible project IDs
    let projectFilter = {};
    if (userRole !== 'admin') {
      const memberships = await ProjectMember.findAll({
        where: { userId },
        attributes: ['projectId'],
      });
      projectFilter = { projectId: { [Op.in]: memberships.map(m => m.projectId) } };
    }
    
    const dateFilter = {};
    if (start) dateFilter[Op.gte] = new Date(start);
    if (end) dateFilter[Op.lte] = new Date(end);
    
    // Get tasks with due dates
    const tasks = await ProjectTask.findAll({
      where: {
        ...projectFilter,
        dueDate: Object.keys(dateFilter).length > 0 ? dateFilter : { [Op.ne]: null },
      },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] },
        { model: User, as: 'assignee', attributes: ['id', 'fullName'] },
      ],
      order: [['dueDate', 'ASC']],
    });
    
    // Get project deadlines
    const projects = await Project.findAll({
      where: {
        ...(userRole !== 'admin' ? { id: { [Op.in]: Object.values(projectFilter)[0]?.[Op.in] || [] } } : {}),
        deadline: Object.keys(dateFilter).length > 0 ? dateFilter : { [Op.ne]: null },
        isArchived: false,
      },
      attributes: ['id', 'name', 'deadline', 'color'],
      order: [['deadline', 'ASC']],
    });
    
    // Format for calendar
    const events = [
      ...tasks.map(task => ({
        id: `task-${task.id}`,
        title: task.title,
        date: task.dueDate,
        type: 'task',
        status: task.status,
        priority: task.priority,
        project: task.project,
        assignee: task.assignee,
        color: task.project?.color || '#1DA1F2',
      })),
      ...projects.map(project => ({
        id: `project-${project.id}`,
        title: `${project.name} (Deadline)`,
        date: project.deadline,
        type: 'deadline',
        projectId: project.id,
        projectName: project.name,
        color: project.color || '#1DA1F2',
      })),
    ];
    
    res.json({
      success: true,
      data: { events },
    });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar data',
      error: error.message,
    });
  }
};
