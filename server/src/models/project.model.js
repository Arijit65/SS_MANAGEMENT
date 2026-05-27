const { DataTypes } = require('sequelize');

// Project statuses
const PROJECT_STATUSES = ['active', 'completed', 'on_hold', 'archived'];

// Project priorities
const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

module.exports = (sequelize) => {
  const Project = sequelize.define(
    'Project',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      client: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(...PROJECT_STATUSES),
        defaultValue: 'active',
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM(...PROJECT_PRIORITIES),
        defaultValue: 'medium',
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      budget: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(7),
        defaultValue: '#1DA1F2',
        validate: {
          is: /^#[0-9A-Fa-f]{6}$/,
        },
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      settings: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
      tableName: 'projects',
      timestamps: true,
      indexes: [
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['deadline'] },
        { fields: ['createdBy'] },
        { fields: ['isArchived'] },
        { fields: ['createdAt'] },
      ],
    }
  );

  // Static properties
  Project.STATUSES = PROJECT_STATUSES;
  Project.PRIORITIES = PROJECT_PRIORITIES;

  return Project;
};
