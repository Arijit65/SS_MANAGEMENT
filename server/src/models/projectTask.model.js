const { DataTypes } = require('sequelize');

// Task statuses for Kanban
const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'];

// Task priorities
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// Task types
const TASK_TYPES = ['task', 'bug', 'feature', 'improvement', 'documentation'];

module.exports = (sequelize) => {
  const ProjectTask = sequelize.define(
    'ProjectTask',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id',
        },
      },
      parentTaskId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'project_tasks',
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(...TASK_STATUSES),
        defaultValue: 'todo',
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM(...TASK_PRIORITIES),
        defaultValue: 'medium',
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(...TASK_TYPES),
        defaultValue: 'task',
        allowNull: false,
      },
      assigneeId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      reporterId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      estimatedHours: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
      },
      actualHours: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      labels: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      attachmentCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      commentCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      checklist: {
        type: DataTypes.JSONB,
        defaultValue: [],
        // Format: [{ id, text, completed }]
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'project_tasks',
      timestamps: true,
      indexes: [
        { fields: ['projectId'] },
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['assigneeId'] },
        { fields: ['dueDate'] },
        { fields: ['parentTaskId'] },
        { fields: ['order'] },
        { fields: ['projectId', 'status'] },
      ],
    }
  );

  // Static properties
  ProjectTask.STATUSES = TASK_STATUSES;
  ProjectTask.PRIORITIES = TASK_PRIORITIES;
  ProjectTask.TYPES = TASK_TYPES;

  return ProjectTask;
};
