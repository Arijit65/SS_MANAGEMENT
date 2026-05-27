const { DataTypes } = require('sequelize');

/**
 * TableAccessRule model - Stores granular access rules for table permissions
 * 
 * This model supports:
 * - Row-level access: specific IDs, conditions, or created_by user
 * - Column-level access: whitelist of allowed columns
 * 
 * Rules are combined with OR logic for the same permission.
 * Restricted access is VIEW-ONLY.
 */
module.exports = (sequelize) => {
  const TableAccessRule = sequelize.define(
    'TableAccessRule',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      permission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'user_table_permissions',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'The permission this rule belongs to',
      },
      rule_type: {
        type: DataTypes.ENUM('row', 'column'),
        allowNull: false,
        comment: 'Type of access rule: row-level or column-level',
      },
      // Row rule fields
      row_filter_type: {
        type: DataTypes.ENUM('specific_ids', 'condition', 'created_by'),
        allowNull: true,
        comment: 'How to filter rows: specific IDs, a condition, or own rows only',
      },
      row_ids: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: true,
        comment: 'For specific_ids: list of record IDs user can access',
      },
      row_condition: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'For condition: {field, operator, value} or {field, operator, special: "current_user"}',
        // Example conditions:
        // { field: 'status', operator: '=', value: 'active' }
        // { field: 'assigned_to', operator: '=', special: 'current_user' }
        // { field: 'department', operator: 'IN', value: ['sales', 'marketing'] }
      },
      // Column rule fields
      allowed_columns: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        comment: 'Whitelist of column names the user can see',
      },
      // Metadata
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Human-readable description of this rule',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this rule is currently active',
      },
    },
    {
      tableName: 'table_access_rules',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          name: 'idx_table_access_rules_permission',
          fields: ['permission_id'],
        },
        {
          name: 'idx_table_access_rules_type',
          fields: ['rule_type'],
        },
        {
          name: 'idx_table_access_rules_permission_type',
          fields: ['permission_id', 'rule_type'],
        },
      ],
    }
  );

  // Static constants for rule types
  TableAccessRule.RULE_TYPES = {
    ROW: 'row',
    COLUMN: 'column',
  };

  TableAccessRule.ROW_FILTER_TYPES = {
    SPECIFIC_IDS: 'specific_ids',
    CONDITION: 'condition',
    CREATED_BY: 'created_by',
  };

  // Supported operators for conditions
  TableAccessRule.CONDITION_OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'LIKE', 'ILIKE'];

  // Helper to validate row_condition structure
  TableAccessRule.validateCondition = (condition) => {
    if (!condition || typeof condition !== 'object') {
      return { valid: false, error: 'Condition must be an object' };
    }

    const { field, operator, value, special } = condition;

    if (!field || typeof field !== 'string') {
      return { valid: false, error: 'Condition must have a valid field name' };
    }

    if (!operator || !TableAccessRule.CONDITION_OPERATORS.includes(operator)) {
      return { valid: false, error: `Invalid operator. Must be one of: ${TableAccessRule.CONDITION_OPERATORS.join(', ')}` };
    }

    // Must have either value or special
    if (value === undefined && !special) {
      return { valid: false, error: 'Condition must have a value or special reference' };
    }

    // Validate special values
    if (special && !['current_user', 'current_user_id'].includes(special)) {
      return { valid: false, error: 'Invalid special value. Must be "current_user" or "current_user_id"' };
    }

    // Validate value type for operators
    if (['IN', 'NOT IN'].includes(operator) && !Array.isArray(value) && !special) {
      return { valid: false, error: 'IN/NOT IN operators require an array value' };
    }

    return { valid: true };
  };

  return TableAccessRule;
};
