const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CustomTable = sequelize.define(
    'CustomTable',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-z0-9-]+$/i, // slug format: alphanumeric and hyphens only
        },
      },
      display_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      icon: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'FileText',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_archived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      archived_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      entry_mode: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'inline',
        validate: {
          isIn: [['inline', 'form']],
        },
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'custom_tables',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return CustomTable;
};
