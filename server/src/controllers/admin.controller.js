const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const { User, UserTablePermission, TableAccessRule, CustomTable, CustomField, sequelize } = require('../models');
const asyncHandler = require('../utils/async-handler');

// Get all available roles
const getRoles = asyncHandler(async (req, res) => {
  const roles = User.ROLES ? User.ROLES.filter(r => r !== 'admin') : [];
  const roleDisplayNames = User.ROLE_DISPLAY_NAMES || {};
  
  return res.status(200).json({
    success: true,
    data: {
      roles,
      roleDisplayNames,
    },
  });
});

// Get all available tables for permission assignment
const getAvailableTables = asyncHandler(async (req, res) => {
  // All tables are now custom tables
  let customTables = [];
  try {
    customTables = await CustomTable.findAll({
      where: { is_active: true, is_archived: false },
      attributes: ['id', 'name', 'display_name', 'icon'],
      order: [['display_name', 'ASC']],
    });
  } catch (error) {
    console.warn('Warning: Could not fetch custom tables:', error.message);
  }

  return res.status(200).json({
    success: true,
    data: {
      customTables: customTables.map(t => ({
        type: 'custom',
        name: t.name,
        displayName: t.display_name,
        icon: t.icon,
      })),
    },
  });
});

// List all users (admin only)
const listUsers = asyncHandler(async (req, res) => {
  const { search, role, isActive } = req.query;

  const where = {};
  
  if (search) {
    where[Op.or] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const users = await User.findAll({
    where,
    attributes: ['id', 'fullName', 'email', 'mobile', 'role', 'isActive', 'createdAt', 'createdBy'],
    include: [
      {
        model: UserTablePermission,
        as: 'tablePermissions',
        attributes: ['id', 'tableType', 'tableName', 'canView', 'canCreate', 'canEdit', 'canDelete', 'accessLevel'],
        include: [{
          model: TableAccessRule,
          as: 'accessRules',
          attributes: ['id', 'rule_type', 'row_filter_type', 'row_ids', 'row_condition', 'allowed_columns', 'description', 'is_active'],
          required: false,
        }],
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json({
    success: true,
    data: users,
  });
});

// Get single user by ID
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    attributes: ['id', 'fullName', 'email', 'mobile', 'role', 'isActive', 'createdAt', 'createdBy'],
    include: [
      {
        model: UserTablePermission,
        as: 'tablePermissions',
        attributes: ['id', 'tableType', 'tableName', 'canView', 'canCreate', 'canEdit', 'canDelete', 'accessLevel'],
        include: [{
          model: TableAccessRule,
          as: 'accessRules',
          attributes: ['id', 'rule_type', 'row_filter_type', 'row_ids', 'row_condition', 'allowed_columns', 'description', 'is_active'],
          required: false,
        }],
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName'],
      },
    ],
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: user,
  });
});

// Create new user (admin only)
const createUser = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, password, role, isActive, tablePermissions } = req.body;

  console.log('Creating user with permissions:', { 
    fullName, email, role, 
    permissionsCount: tablePermissions?.length || 0,
    permissions: tablePermissions 
  });

  // Validation
  if (!fullName || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'fullName, email, password, and role are required',
    });
  }

  // Don't allow creating admin users through this endpoint
  if (role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Cannot create admin users through this endpoint',
    });
  }

  // Validate role
  if (!User.ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Must be one of: ${User.ROLES.join(', ')}`,
    });
  }

  // Check if email already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Use transaction for creating user and permissions
  const result = await sequelize.transaction(async (t) => {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create(
      {
        fullName,
        email,
        mobile,
        password: hashedPassword,
        role,
        isActive: isActive !== false,
        createdBy: req.user.sub,
      },
      { transaction: t }
    );

    console.log('User created with ID:', user.id);

    // Create table permissions if provided
    if (tablePermissions && Array.isArray(tablePermissions) && tablePermissions.length > 0) {
      for (const p of tablePermissions) {
        // Create the permission
        const permission = await UserTablePermission.create({
          userId: user.id,
          tableType: p.tableType,
          tableName: p.tableName,
          canView: p.canView === true,
          canCreate: p.canCreate === true,
          canEdit: p.canEdit === true,
          canDelete: p.canDelete === true,
          accessLevel: p.accessLevel || 'full',
        }, { transaction: t });

        console.log('Created permission:', permission.id, 'with accessLevel:', p.accessLevel);

        // Create access rules if provided and access level is restricted
        if (p.accessLevel === 'restricted' && p.accessRules && Array.isArray(p.accessRules)) {
          const ruleRecords = p.accessRules.map(rule => ({
            permission_id: permission.id,
            rule_type: rule.rule_type,
            row_filter_type: rule.row_filter_type || null,
            row_ids: rule.row_ids || null,
            row_condition: rule.row_condition || null,
            allowed_columns: rule.allowed_columns || null,
            description: rule.description || null,
            is_active: rule.is_active !== false,
          }));

          await TableAccessRule.bulkCreate(ruleRecords, { transaction: t });
          console.log('Created', ruleRecords.length, 'access rules for permission:', permission.id);
        }
      }
    } else {
      console.log('No permissions to create');
    }

    // Fetch the created user with permissions and access rules
    const createdUser = await User.findByPk(user.id, {
      attributes: ['id', 'fullName', 'email', 'mobile', 'role', 'isActive', 'createdAt'],
      include: [{
        model: UserTablePermission,
        as: 'tablePermissions',
        attributes: ['id', 'tableType', 'tableName', 'canView', 'canCreate', 'canEdit', 'canDelete', 'accessLevel'],
        include: [{
          model: TableAccessRule,
          as: 'accessRules',
          attributes: ['id', 'rule_type', 'row_filter_type', 'row_ids', 'row_condition', 'allowed_columns', 'description', 'is_active'],
          required: false,
        }],
      }],
      transaction: t,
    });

    console.log('Returning user with permissions:', createdUser?.tablePermissions?.length || 0);
    return createdUser;
  });

  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: result,
  });
});

// Update user (admin only)
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, email, mobile, password, role, isActive, tablePermissions } = req.body;

  const user = await User.findByPk(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Don't allow editing admin users (except by themselves)
  if (user.role === 'admin' && req.user.sub !== user.id) {
    return res.status(403).json({
      success: false,
      message: 'Cannot edit other admin users',
    });
  }

  // Don't allow changing role to admin
  if (role === 'admin' && user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Cannot promote user to admin',
    });
  }

  // Check if email is taken by another user
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already taken by another user',
      });
    }
  }

  // Use transaction for updating user and permissions
  const result = await sequelize.transaction(async (t) => {
    // Update user fields
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (role && user.role !== 'admin') updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData, { transaction: t });

    // Update table permissions if provided
    if (tablePermissions && Array.isArray(tablePermissions)) {
      // Delete existing permissions (this cascades to access rules)
      await UserTablePermission.destroy({
        where: { userId: user.id },
        transaction: t,
      });

      // Create new permissions with access rules
      for (const p of tablePermissions) {
        const permission = await UserTablePermission.create({
          userId: user.id,
          tableType: p.tableType,
          tableName: p.tableName,
          canView: p.canView !== false,
          canCreate: p.canCreate === true,
          canEdit: p.canEdit === true,
          canDelete: p.canDelete === true,
          accessLevel: p.accessLevel || 'full',
        }, { transaction: t });

        // Create access rules if provided and access level is restricted
        if (p.accessLevel === 'restricted' && p.accessRules && Array.isArray(p.accessRules)) {
          const ruleRecords = p.accessRules.map(rule => ({
            permission_id: permission.id,
            rule_type: rule.rule_type,
            row_filter_type: rule.row_filter_type || null,
            row_ids: rule.row_ids || null,
            row_condition: rule.row_condition || null,
            allowed_columns: rule.allowed_columns || null,
            description: rule.description || null,
            is_active: rule.is_active !== false,
          }));

          await TableAccessRule.bulkCreate(ruleRecords, { transaction: t });
        }
      }
    }

    // Fetch updated user with permissions and access rules
    const updatedUser = await User.findByPk(user.id, {
      attributes: ['id', 'fullName', 'email', 'mobile', 'role', 'isActive', 'createdAt', 'updatedAt'],
      include: [{
        model: UserTablePermission,
        as: 'tablePermissions',
        attributes: ['id', 'tableType', 'tableName', 'canView', 'canCreate', 'canEdit', 'canDelete', 'accessLevel'],
        include: [{
          model: TableAccessRule,
          as: 'accessRules',
          attributes: ['id', 'rule_type', 'row_filter_type', 'row_ids', 'row_condition', 'allowed_columns', 'description', 'is_active'],
          required: false,
        }],
      }],
      transaction: t,
    });

    return updatedUser;
  });

  return res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

// Delete user (admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Don't allow deleting admin users
  if (user.role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Cannot delete admin users',
    });
  }

  // Don't allow deleting yourself
  if (user.id === req.user.sub) {
    return res.status(403).json({
      success: false,
      message: 'Cannot delete your own account',
    });
  }

  // Delete user (permissions will be cascade deleted)
  await user.destroy();

  return res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

// Toggle user active status
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Don't allow deactivating admin users
  if (user.role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Cannot deactivate admin users',
    });
  }

  await user.update({ isActive: !user.isActive });

  return res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      id: user.id,
      isActive: user.isActive,
    },
  });
});

// Get access rules for a specific permission
const getAccessRules = asyncHandler(async (req, res) => {
  const { userId, permissionId } = req.params;

  // Check if permission exists and belongs to user
  const permission = await UserTablePermission.findOne({
    where: { id: permissionId, userId },
    include: [{
      model: TableAccessRule,
      as: 'accessRules',
      attributes: ['id', 'rule_type', 'row_filter_type', 'row_ids', 'row_condition', 'allowed_columns', 'description', 'is_active', 'createdAt'],
    }],
  });

  if (!permission) {
    return res.status(404).json({
      success: false,
      message: 'Permission not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      permission: {
        id: permission.id,
        tableType: permission.tableType,
        tableName: permission.tableName,
        accessLevel: permission.accessLevel,
      },
      accessRules: permission.accessRules || [],
    },
  });
});

// Create a new access rule
const createAccessRule = asyncHandler(async (req, res) => {
  const { userId, permissionId } = req.params;
  const { rule_type, row_filter_type, row_ids, row_condition, allowed_columns, description, is_active } = req.body;

  // Check if permission exists and belongs to user
  const permission = await UserTablePermission.findOne({
    where: { id: permissionId, userId },
  });

  if (!permission) {
    return res.status(404).json({
      success: false,
      message: 'Permission not found',
    });
  }

  // Update permission to restricted if not already
  if (permission.accessLevel !== 'restricted') {
    await permission.update({ accessLevel: 'restricted' });
  }

  // Validate rule data
  if (!rule_type || !['row', 'column'].includes(rule_type)) {
    return res.status(400).json({
      success: false,
      message: 'rule_type must be either "row" or "column"',
    });
  }

  if (rule_type === 'row' && !row_filter_type) {
    return res.status(400).json({
      success: false,
      message: 'row_filter_type is required for row rules',
    });
  }

  if (rule_type === 'column' && (!allowed_columns || !Array.isArray(allowed_columns))) {
    return res.status(400).json({
      success: false,
      message: 'allowed_columns array is required for column rules',
    });
  }

  const rule = await TableAccessRule.create({
    permission_id: permissionId,
    rule_type,
    row_filter_type: row_filter_type || null,
    row_ids: row_ids || null,
    row_condition: row_condition || null,
    allowed_columns: allowed_columns || null,
    description: description || null,
    is_active: is_active !== false,
  });

  return res.status(201).json({
    success: true,
    message: 'Access rule created successfully',
    data: rule,
  });
});

// Update an access rule
const updateAccessRule = asyncHandler(async (req, res) => {
  const { userId, permissionId, ruleId } = req.params;
  const { rule_type, row_filter_type, row_ids, row_condition, allowed_columns, description, is_active } = req.body;

  // Check if permission exists and belongs to user
  const permission = await UserTablePermission.findOne({
    where: { id: permissionId, userId },
  });

  if (!permission) {
    return res.status(404).json({
      success: false,
      message: 'Permission not found',
    });
  }

  // Find the rule
  const rule = await TableAccessRule.findOne({
    where: { id: ruleId, permission_id: permissionId },
  });

  if (!rule) {
    return res.status(404).json({
      success: false,
      message: 'Access rule not found',
    });
  }

  // Update rule fields
  const updateData = {};
  if (rule_type !== undefined) updateData.rule_type = rule_type;
  if (row_filter_type !== undefined) updateData.row_filter_type = row_filter_type;
  if (row_ids !== undefined) updateData.row_ids = row_ids;
  if (row_condition !== undefined) updateData.row_condition = row_condition;
  if (allowed_columns !== undefined) updateData.allowed_columns = allowed_columns;
  if (description !== undefined) updateData.description = description;
  if (is_active !== undefined) updateData.is_active = is_active;

  await rule.update(updateData);

  return res.status(200).json({
    success: true,
    message: 'Access rule updated successfully',
    data: rule,
  });
});

// Delete an access rule
const deleteAccessRule = asyncHandler(async (req, res) => {
  const { userId, permissionId, ruleId } = req.params;

  // Check if permission exists and belongs to user
  const permission = await UserTablePermission.findOne({
    where: { id: permissionId, userId },
  });

  if (!permission) {
    return res.status(404).json({
      success: false,
      message: 'Permission not found',
    });
  }

  // Find and delete the rule
  const rule = await TableAccessRule.findOne({
    where: { id: ruleId, permission_id: permissionId },
  });

  if (!rule) {
    return res.status(404).json({
      success: false,
      message: 'Access rule not found',
    });
  }

  await rule.destroy();

  // Check if there are any remaining rules, if not, revert access level to full
  const remainingRules = await TableAccessRule.count({
    where: { permission_id: permissionId },
  });

  if (remainingRules === 0) {
    await permission.update({ accessLevel: 'full' });
  }

  return res.status(200).json({
    success: true,
    message: 'Access rule deleted successfully',
  });
});

// Update permission access level
const updatePermissionAccessLevel = asyncHandler(async (req, res) => {
  const { userId, permissionId } = req.params;
  const { accessLevel } = req.body;

  if (!accessLevel || !['full', 'restricted'].includes(accessLevel)) {
    return res.status(400).json({
      success: false,
      message: 'accessLevel must be either "full" or "restricted"',
    });
  }

  const permission = await UserTablePermission.findOne({
    where: { id: permissionId, userId },
  });

  if (!permission) {
    return res.status(404).json({
      success: false,
      message: 'Permission not found',
    });
  }

  await permission.update({ accessLevel });

  // If changing to full, delete all access rules
  if (accessLevel === 'full') {
    await TableAccessRule.destroy({
      where: { permission_id: permissionId },
    });
  }

  return res.status(200).json({
    success: true,
    message: `Permission access level updated to ${accessLevel}`,
    data: {
      id: permission.id,
      accessLevel: permission.accessLevel,
    },
  });
});

// Get available fields for a table (for building access rules)
const getTableFields = asyncHandler(async (req, res) => {
  const { tableType, tableName } = req.query;

  if (!tableType || !tableName) {
    return res.status(400).json({
      success: false,
      message: 'tableType and tableName are required',
    });
  }

  if (tableType === 'custom') {
    const table = await CustomTable.findOne({
      where: { name: tableName },
      include: [{
        model: CustomField,
        as: 'fields',
        attributes: ['id', 'name', 'displayName', 'fieldType'],
        order: [['order', 'ASC']],
      }],
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        tableName: table.name,
        displayName: table.displayName,
        fields: table.fields || [],
      },
    });
  }

  // For system tables, return predefined fields
  const systemTableFields = {
    onboarding: ['id', 'fullName', 'email', 'mobile', 'status', 'createdAt', 'createdBy'],
    followup: ['id', 'clientName', 'followupDate', 'status', 'notes', 'createdAt', 'createdBy'],
    websites: ['id', 'siteName', 'siteUrl', 'status', 'createdAt', 'createdBy'],
  };

  const fields = systemTableFields[tableName] || [];

  return res.status(200).json({
    success: true,
    data: {
      tableName,
      displayName: tableName,
      fields: fields.map(f => ({ name: f, displayName: f, fieldType: 'text' })),
    },
  });
});

module.exports = {
  getRoles,
  getAvailableTables,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getAccessRules,
  createAccessRule,
  updateAccessRule,
  deleteAccessRule,
  updatePermissionAccessLevel,
  getTableFields,
};
