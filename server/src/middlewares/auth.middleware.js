const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required',
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  return next();
};

// Middleware factory to require specific roles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Admin always has access
    if (req.user.role === 'admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    return next();
  };
};

// Middleware to check table-specific permissions
const requireTablePermission = (tableType, tableName, permissionType = 'canView') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Admin always has full access
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const { UserTablePermission, TableAccessRule } = require('../models');
      
      const permission = await UserTablePermission.findOne({
        where: {
          userId: req.user.sub,
          tableType,
          tableName,
        },
        include: [{
          model: TableAccessRule,
          as: 'accessRules',
          where: { is_active: true },
          required: false,
        }],
      });

      if (!permission || !permission[permissionType]) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You do not have ${permissionType} permission for this table.`,
        });
      }

      // For restricted access, only allow view operations
      if (permission.accessLevel === 'restricted' && permissionType !== 'canView') {
        return res.status(403).json({
          success: false,
          message: 'Restricted access is view-only. You cannot create, edit, or delete records.',
        });
      }

      // Attach permission to request for use in controller
      req.tablePermission = permission;
      return next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
      });
    }
  };
};

// Dynamic middleware that extracts table info from route params
const checkTableAccess = (permissionType = 'canView') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Admin always has full access
    if (req.user.role === 'admin') {
      req.isFullAccess = true;
      return next();
    }

    const { tableName } = req.params;
    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: 'Table name is required',
      });
    }

    try {
      const { UserTablePermission, CustomTable, TableAccessRule } = require('../models');
      
      // Check if it's a custom table
      const customTable = await CustomTable.findOne({
        where: { name: tableName, is_active: true, is_archived: false },
      });

      const tableType = customTable ? 'custom' : 'system';

      const permission = await UserTablePermission.findOne({
        where: {
          userId: req.user.sub,
          tableType,
          tableName,
        },
        include: [{
          model: TableAccessRule,
          as: 'accessRules',
          where: { is_active: true },
          required: false,
        }],
      });

      if (!permission || !permission[permissionType]) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You do not have ${permissionType} permission for this table.`,
        });
      }

      // For restricted access, only allow view operations
      if (permission.accessLevel === 'restricted' && permissionType !== 'canView') {
        return res.status(403).json({
          success: false,
          message: 'Restricted access is view-only. You cannot create, edit, or delete records.',
        });
      }

      req.tablePermission = permission;
      req.tableType = tableType;
      req.isFullAccess = permission.accessLevel === 'full';
      return next();
    } catch (error) {
      console.error('Table access check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
      });
    }
  };
};

/**
 * Helper to build row filter conditions based on access rules
 * @param {Object} permission - UserTablePermission with accessRules
 * @param {string} userId - Current user's ID
 * @returns {Object|null} Sequelize where clause or null if full access
 */
const buildRowFilter = (permission, userId) => {
  if (!permission || permission.accessLevel === 'full') {
    return null;
  }

  const rowRules = (permission.accessRules || []).filter(r => r.rule_type === 'row');
  if (rowRules.length === 0) {
    return null; // No row rules = full row access within restricted permission
  }

  const { Op } = require('sequelize');
  const conditions = [];

  for (const rule of rowRules) {
    switch (rule.row_filter_type) {
      case 'specific_ids':
        if (rule.row_ids && rule.row_ids.length > 0) {
          conditions.push({ id: { [Op.in]: rule.row_ids } });
        }
        break;

      case 'created_by':
        conditions.push({ created_by: userId });
        break;

      case 'condition':
        if (rule.row_condition) {
          const { field, operator, value, special } = rule.row_condition;
          let filterValue = value;
          
          // Handle special values
          if (special === 'current_user' || special === 'current_user_id') {
            filterValue = userId;
          }

          // Build the condition based on operator
          // Note: For JSONB fields, we need to use raw queries or postgres-specific operators
          // This basic implementation works for top-level fields
          conditions.push(buildCondition(field, operator, filterValue));
        }
        break;
    }
  }

  // Combine with OR logic
  if (conditions.length === 0) {
    return null;
  }

  return conditions.length === 1 ? conditions[0] : { [Op.or]: conditions };
};

/**
 * Helper to build a single condition
 */
const buildCondition = (field, operator, value) => {
  const { Op } = require('sequelize');
  
  const opMap = {
    '=': Op.eq,
    '!=': Op.ne,
    '>': Op.gt,
    '<': Op.lt,
    '>=': Op.gte,
    '<=': Op.lte,
    'IN': Op.in,
    'NOT IN': Op.notIn,
    'LIKE': Op.like,
    'ILIKE': Op.iLike,
  };

  const seqOp = opMap[operator] || Op.eq;
  return { [field]: { [seqOp]: value } };
};

/**
 * Helper to get allowed columns based on access rules
 * @param {Object} permission - UserTablePermission with accessRules
 * @returns {string[]|null} Array of allowed column names or null if full access
 */
const getAllowedColumns = (permission) => {
  if (!permission || permission.accessLevel === 'full') {
    return null;
  }

  const columnRules = (permission.accessRules || []).filter(r => r.rule_type === 'column');
  if (columnRules.length === 0) {
    return null; // No column rules = full column access
  }

  // Combine all allowed columns from all rules (union)
  const allAllowed = new Set();
  for (const rule of columnRules) {
    if (rule.allowed_columns && Array.isArray(rule.allowed_columns)) {
      rule.allowed_columns.forEach(col => allAllowed.add(col));
    }
  }

  // Always include 'id' for basic functionality
  allAllowed.add('id');

  return Array.from(allAllowed);
};

/**
 * Helper to filter data based on column restrictions
 * @param {Object} data - The data object to filter
 * @param {string[]} allowedColumns - Array of allowed column names
 * @returns {Object} Filtered data object
 */
const filterDataColumns = (data, allowedColumns) => {
  if (!allowedColumns || allowedColumns.length === 0) {
    return data;
  }

  const filtered = {};
  for (const col of allowedColumns) {
    if (col in data) {
      filtered[col] = data[col];
    }
  }
  return filtered;
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireRole,
  requireTablePermission,
  checkTableAccess,
  buildRowFilter,
  getAllowedColumns,
  filterDataColumns,
};
