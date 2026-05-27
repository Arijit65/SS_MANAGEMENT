const { DataTypes } = require('sequelize');

// Define all available roles
const USER_ROLES = [
  'admin',
  'content_writer',
  'coordinator',
  'design_qc',
  'customer_support',
  'marketer',
  'developer',
  'graphics_designer'
];

// Role display names mapping
const ROLE_DISPLAY_NAMES = {
  admin: 'Admin',
  content_writer: 'Content Writer',
  coordinator: 'Coordinator',
  design_qc: 'Design QC',
  customer_support: 'Customer Support',
  marketer: 'Marketer',
  developer: 'Developer',
  graphics_designer: 'Graphics Designer'
};

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      mobile: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING(50),
        defaultValue: 'content_writer',
        allowNull: false,
        validate: {
          isIn: [USER_ROLES],
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
    }
  );

  // Static properties
  User.ROLES = USER_ROLES;
  User.ROLE_DISPLAY_NAMES = ROLE_DISPLAY_NAMES;

  return User;
};
