const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const env = require('../config/env');
const { User, UserTablePermission, TableAccessRule } = require('../models');
const asyncHandler = require('../utils/async-handler');

// Login - single endpoint for all users including admin
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  const user = await User.findOne({ where: { email } });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated. Please contact administrator.',
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Fetch user's table permissions with access rules
  const tablePermissions = await UserTablePermission.findAll({
    where: { userId: user.id },
    attributes: ['id', 'tableType', 'tableName', 'canView', 'canCreate', 'canEdit', 'canDelete', 'accessLevel'],
    include: [{
      model: TableAccessRule,
      as: 'accessRules',
      attributes: ['id', 'rule_type', 'row_filter_type', 'row_ids', 'row_condition', 'allowed_columns', 'description', 'is_active'],
      required: false,
    }],
  });

  console.log(`Login: User ${user.email} (${user.role}) has ${tablePermissions.length} permissions`);
  if (tablePermissions.length > 0) {
    console.log('Permissions:', tablePermissions.map(p => 
      `${p.tableName}: view=${p.canView}, access=${p.accessLevel}, rules=${p.accessRules?.length || 0}`
    ).join(', '));
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isActive: user.isActive,
        tablePermissions: tablePermissions.map(p => p.toJSON()),
      },
    },
  });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.sub, {
    attributes: ['id', 'fullName', 'email', 'mobile', 'role', 'isActive', 'createdAt'],
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const tablePermissions = await UserTablePermission.findAll({
    where: { userId: user.id },
    attributes: ['id', 'tableType', 'tableName', 'canView', 'canCreate', 'canEdit', 'canDelete', 'accessLevel'],
    include: [{
      model: TableAccessRule,
      as: 'accessRules',
      attributes: ['id', 'rule_type', 'row_filter_type', 'row_ids', 'row_condition', 'allowed_columns', 'description', 'is_active'],
      required: false,
    }],
  });

  return res.status(200).json({
    success: true,
    data: {
      ...user.toJSON(),
      tablePermissions: tablePermissions.map(p => p.toJSON()),
    },
  });
});

module.exports = {
  login,
  getProfile,
};
