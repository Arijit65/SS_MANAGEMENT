const { DataTypes } = require('sequelize');

// Activity types
const ACTIVITY_TYPES = [
  'project_created',
  'project_updated',
  'project_archived',
  'project_restored',
  'task_created',
  'task_updated',
  'task_deleted',
  'task_status_changed',
  'task_assigned',
  'task_completed',
  'member_added',
  'member_removed',
  'member_role_changed',
  'file_uploaded',
  'file_deleted',
  'comment_added',
  'comment_edited',
  'comment_deleted',
];

module.exports = (sequelize) => {
  const ProjectActivity = sequelize.define(
    'ProjectActivity',
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
      taskId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'project_tasks',
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      activityType: {
        type: DataTypes.ENUM(...ACTIVITY_TYPES),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      changes: {
        type: DataTypes.JSONB,
        defaultValue: {},
        // Format: { field: { from: oldValue, to: newValue } }
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        // Store additional context like task title, member name, etc.
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
    },
    {
      tableName: 'project_activities',
      timestamps: true,
      updatedAt: false, // Activities are immutable
      indexes: [
        { fields: ['projectId'] },
        { fields: ['taskId'] },
        { fields: ['userId'] },
        { fields: ['activityType'] },
        { fields: ['createdAt'] },
        { fields: ['projectId', 'createdAt'] },
      ],
    }
  );

  // Static properties
  ProjectActivity.TYPES = ACTIVITY_TYPES;

  // Helper to create activity log
  ProjectActivity.log = async (data) => {
    try {
      return await ProjectActivity.create(data);
    } catch (error) {
      console.error('Failed to log activity:', error);
      return null;
    }
  };

  return ProjectActivity;
};
