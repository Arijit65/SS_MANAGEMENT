const { DataTypes } = require('sequelize');

// Define table types - 'system' type removed as all tables are now custom
const TABLE_TYPES = ['custom'];

// Access levels for granular permissions
const ACCESS_LEVELS = ['full', 'restricted'];

module.exports = (sequelize) => {
  const UserTablePermission = sequelize.define(
    'UserTablePermission',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      tableType: {
        type: DataTypes.ENUM(...TABLE_TYPES),
        allowNull: false,
      },
      tableName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      canView: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      canCreate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      canEdit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      canDelete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // NEW: Access level for granular permissions
      accessLevel: {
        type: DataTypes.ENUM(...ACCESS_LEVELS),
        allowNull: false,
        defaultValue: 'full',
        field: 'access_level',
        comment: 'full: all rows/columns, restricted: only specified rows/columns (view-only)',
      },
    },
    {
      tableName: 'user_table_permissions',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'tableType', 'tableName'],
          name: 'unique_user_table_permission',
        },
      ],
    }
  );

  // Static properties
  UserTablePermission.TABLE_TYPES = TABLE_TYPES;
  UserTablePermission.ACCESS_LEVELS = ACCESS_LEVELS;

  return UserTablePermission;
};
