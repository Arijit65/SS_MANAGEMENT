const { DataTypes } = require('sequelize');

// Member roles within a project
const MEMBER_ROLES = ['owner', 'manager', 'member', 'viewer'];

// Permission levels
const PERMISSION_LEVELS = ['view_only', 'edit_tasks', 'manage_project', 'full_admin'];

module.exports = (sequelize) => {
  const ProjectMember = sequelize.define(
    'ProjectMember',
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
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      role: {
        type: DataTypes.ENUM(...MEMBER_ROLES),
        defaultValue: 'member',
        allowNull: false,
      },
      permissionLevel: {
        type: DataTypes.ENUM(...PERMISSION_LEVELS),
        defaultValue: 'edit_tasks',
        allowNull: false,
      },
      canViewTasks: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      canCreateTasks: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      canEditTasks: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      canDeleteTasks: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      canManageMembers: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      canManageFiles: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      canEditProject: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      addedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'project_members',
      timestamps: true,
      indexes: [
        { fields: ['projectId'] },
        { fields: ['userId'] },
        { unique: true, fields: ['projectId', 'userId'] },
        { fields: ['role'] },
      ],
    }
  );

  // Static properties
  ProjectMember.ROLES = MEMBER_ROLES;
  ProjectMember.PERMISSION_LEVELS = PERMISSION_LEVELS;

  // Helper to set permissions based on permission level
  ProjectMember.setPermissionsFromLevel = (level) => {
    const permissions = {
      view_only: {
        canViewTasks: true,
        canCreateTasks: false,
        canEditTasks: false,
        canDeleteTasks: false,
        canManageMembers: false,
        canManageFiles: false,
        canEditProject: false,
      },
      edit_tasks: {
        canViewTasks: true,
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: false,
        canManageMembers: false,
        canManageFiles: true,
        canEditProject: false,
      },
      manage_project: {
        canViewTasks: true,
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: true,
        canManageMembers: true,
        canManageFiles: true,
        canEditProject: true,
      },
      full_admin: {
        canViewTasks: true,
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: true,
        canManageMembers: true,
        canManageFiles: true,
        canEditProject: true,
      },
    };
    return permissions[level] || permissions.view_only;
  };

  return ProjectMember;
};
