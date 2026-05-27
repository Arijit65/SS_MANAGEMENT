const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectComment = sequelize.define(
    'ProjectComment',
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
      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'project_comments',
          key: 'id',
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      authorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      mentions: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
      },
      attachments: {
        type: DataTypes.JSONB,
        defaultValue: [],
        // Format: [{ id, name, url, type }]
      },
      isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'project_comments',
      timestamps: true,
      indexes: [
        { fields: ['projectId'] },
        { fields: ['taskId'] },
        { fields: ['authorId'] },
        { fields: ['parentId'] },
        { fields: ['createdAt'] },
      ],
    }
  );

  return ProjectComment;
};
