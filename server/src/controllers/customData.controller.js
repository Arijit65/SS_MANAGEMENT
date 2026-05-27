const { Op } = require('sequelize');
const { CustomTable, CustomField, CustomTableData, FieldRelation, sequelize } = require('../models');
const asyncHandler = require('../utils/async-handler');
const { buildRowFilter, getAllowedColumns, filterDataColumns } = require('../middlewares/auth.middleware');

// Relation field types
const RELATION_TYPES = ['relation', 'sync'];

// Helper to get table by name with relation info
const getTableByName = async (tableName) => {
  const table = await CustomTable.findOne({
    where: {
      name: tableName,
      is_archived: false,
    },
    include: [
      {
        model: CustomField,
        as: 'fields',
        include: [{
          model: FieldRelation,
          as: 'relation',
          include: [
            { model: CustomTable, as: 'targetTable', attributes: ['id', 'name', 'display_name'] },
            { model: CustomField, as: 'displayField', attributes: ['id', 'name', 'label'] },
          ]
        }],
        order: [['field_order', 'ASC']],
      },
    ],
  });
  return table;
};

// Helper to validate relation field values
const validateRelationValues = async (table, data) => {
  const errors = [];
  const relationFields = table.fields.filter(f => RELATION_TYPES.includes(f.type) && f.relation);

  for (const field of relationFields) {
    const value = data[field.name];
    if (value === undefined || value === null || value === '') continue;

    const { relation } = field;
    const values = relation.allow_multiple ? (Array.isArray(value) ? value : [value]) : [value];

    // Validate each referenced record exists
    for (const refId of values) {
      const refRecord = await CustomTableData.findOne({
        where: {
          id: refId,
          table_id: relation.target_table_id,
        },
      });

      if (!refRecord) {
        errors.push(`${field.label}: Referenced record #${refId} not found in ${relation.targetTable?.display_name || 'target table'}`);
      }
    }
  }

  return errors;
};

// Helper to perform sync operations
const performSync = async (table, record, oldData, newData, operation, transaction = null) => {
  const syncFields = table.fields.filter(f => f.type === 'sync' && f.relation);
  const syncResults = [];

  for (const field of syncFields) {
    const { relation } = field;
    
    // Skip if sync is disabled for this operation
    if (operation === 'create' && !relation.sync_on_create) continue;
    if (operation === 'update' && !relation.sync_on_update) continue;
    if (operation === 'delete' && !relation.sync_on_delete) continue;

    // Only process if field value changed (for updates)
    const oldValue = oldData?.[field.name];
    const newValue = newData?.[field.name];
    
    if (operation === 'update' && JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      continue;
    }

    // Get the target field (if specified)
    const targetFieldId = relation.target_field_id;
    if (!targetFieldId && relation.relation_type === 'bidirectional_sync') {
      // For bidirectional sync, we need a target field
      continue;
    }

    // Find the target field info
    const targetField = await CustomField.findByPk(targetFieldId);
    if (!targetField) continue;

    // Get the referenced record(s)
    const values = relation.allow_multiple ? (Array.isArray(newValue) ? newValue : [newValue]) : [newValue];
    
    for (const refId of values) {
      if (!refId) continue;

      const refRecord = await CustomTableData.findByPk(refId, { transaction });
      if (!refRecord) continue;

      // Update the target record's field to reference back to this record
      const targetData = { ...refRecord.data };
      
      if (relation.relation_type === 'bidirectional_sync') {
        // For bidirectional, set the back-reference
        if (relation.allow_multiple) {
          // Add to array if not already present
          const existingRefs = Array.isArray(targetData[targetField.name]) 
            ? targetData[targetField.name] 
            : [];
          if (!existingRefs.includes(record.id)) {
            targetData[targetField.name] = [...existingRefs, record.id];
          }
        } else {
          targetData[targetField.name] = record.id;
        }

        await refRecord.update({ data: targetData }, { transaction });
        
        syncResults.push({
          action: 'updated',
          target_table_id: relation.target_table_id,
          target_record_id: refId,
          field: targetField.name,
        });
      }
    }

    // Handle removed references (for updates)
    if (operation === 'update' && oldValue && relation.relation_type === 'bidirectional_sync') {
      const oldValues = relation.allow_multiple ? (Array.isArray(oldValue) ? oldValue : [oldValue]) : [oldValue];
      const newValues = relation.allow_multiple ? (Array.isArray(newValue) ? newValue : [newValue]) : [newValue];
      
      // Find removed references
      const removedRefs = oldValues.filter(v => v && !newValues.includes(v));
      
      for (const removedId of removedRefs) {
        const refRecord = await CustomTableData.findByPk(removedId, { transaction });
        if (!refRecord) continue;

        const targetData = { ...refRecord.data };
        
        if (relation.allow_multiple) {
          // Remove from array
          targetData[targetField.name] = (targetData[targetField.name] || []).filter(id => id !== record.id);
        } else {
          targetData[targetField.name] = null;
        }

        await refRecord.update({ data: targetData }, { transaction });
        
        syncResults.push({
          action: 'unlinked',
          target_table_id: relation.target_table_id,
          target_record_id: removedId,
          field: targetField.name,
        });
      }
    }
  }

  return syncResults;
};

// Helper to enrich record data with related record info
const enrichWithRelatedData = async (records, fields) => {
  const relationFields = fields.filter(f => RELATION_TYPES.includes(f.type) && f.relation);
  
  if (relationFields.length === 0) {
    return records;
  }

  // Collect all referenced IDs per target table
  const refsByTable = {};
  
  for (const record of records) {
    for (const field of relationFields) {
      const value = record.data?.[field.name];
      if (!value) continue;
      
      const tableId = field.relation.target_table_id;
      if (!refsByTable[tableId]) {
        refsByTable[tableId] = new Set();
      }
      
      const ids = Array.isArray(value) ? value : [value];
      ids.forEach(id => refsByTable[tableId].add(id));
    }
  }

  // Fetch all referenced records in batches
  const refRecords = {};
  for (const [tableId, ids] of Object.entries(refsByTable)) {
    const records = await CustomTableData.findAll({
      where: {
        table_id: parseInt(tableId),
        id: { [Op.in]: Array.from(ids) },
      },
    });
    refRecords[tableId] = records.reduce((acc, r) => {
      acc[r.id] = r;
      return acc;
    }, {});
  }

  // Enrich records with related data
  return records.map(record => {
    const enrichedData = { ...record.data };
    const _related = {};

    for (const field of relationFields) {
      const value = record.data?.[field.name];
      if (!value) continue;

      const tableId = field.relation.target_table_id;
      const displayFieldName = field.relation.displayField?.name || 'id';
      
      const ids = Array.isArray(value) ? value : [value];
      _related[field.name] = ids.map(id => {
        const refRecord = refRecords[tableId]?.[id];
        if (!refRecord) return { id, _notFound: true };
        
        return {
          id: refRecord.id,
          display_value: refRecord.data?.[displayFieldName] || `#${id}`,
          data: refRecord.data,
        };
      });
    }

    return {
      ...record.toJSON(),
      _related,
    };
  });
};

// GET /custom-data/:tableName - list all records for a table
const getAll = asyncHandler(async (req, res) => {
  const { tableName } = req.params;
  const { page = 1, limit = 20, search, ...filters } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const table = await getTableByName(tableName);
  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  // Build base where clause
  const where = { table_id: table.id };

  // Apply granular row filters for restricted access
  const rowFilter = buildRowFilter(req.tablePermission, req.user?.sub);
  if (rowFilter) {
    // For JSONB data filtering, we need special handling
    // The row filter conditions should be applied to the records
    // We'll apply them in memory after fetching for complex JSONB conditions
  }

  // Get allowed columns for restricted access
  const allowedColumns = getAllowedColumns(req.tablePermission);
  const isRestrictedAccess = req.tablePermission?.accessLevel === 'restricted';

  // Search across searchable fields
  if (search && search.trim()) {
    const searchableFields = table.fields.filter((f) => f.is_searchable);
    if (searchableFields.length > 0) {
      const searchConditions = searchableFields.map((field) => {
        // Use PostgreSQL JSONB operators for searching
        return {
          [Op.and]: [
            { data: { [Op.ne]: null } },
            // Raw query for JSONB text search
          ],
        };
      });

      // For JSONB search, we need to use raw SQL
      // Build search query using sequelize.literal
      const searchLiterals = searchableFields.map(
        (f) => `data->>'${f.name}' ILIKE '%${search.replace(/'/g, "''")}%'`
      );
      where[Op.and] = [
        { table_id: table.id },
        { [Op.or]: searchLiterals.map((s) => require('sequelize').literal(s)) },
      ];
    }
  }

  // Apply additional filters from query params
  // Format: filter_fieldName=value
  Object.keys(filters).forEach((key) => {
    if (key.startsWith('filter_')) {
      const fieldName = key.replace('filter_', '');
      const value = filters[key];
      // We'll handle this with JSONB operators
      // For now, skip complex filtering
    }
  });

  const { count, rows } = await CustomTableData.findAndCountAll({
    where: { table_id: table.id }, // Simplified where for now
    limit: parseInt(limit),
    offset,
    order: [['created_at', 'DESC']],
  });

  let filteredRows = rows;

  // Apply row-level access filter for restricted access
  if (rowFilter && req.tablePermission?.accessRules) {
    const rowRules = req.tablePermission.accessRules.filter(r => r.rule_type === 'row');
    if (rowRules.length > 0) {
      filteredRows = rows.filter(row => {
        // Check if row matches any of the rules (OR logic)
        return rowRules.some(rule => {
          switch (rule.row_filter_type) {
            case 'specific_ids':
              return rule.row_ids && rule.row_ids.includes(row.id);
            
            case 'created_by':
              return row.created_by === req.user?.sub;
            
            case 'condition':
              if (!rule.row_condition) return false;
              const { field, operator, value, special } = rule.row_condition;
              let compareValue = value;
              
              // Handle special values
              if (special === 'current_user' || special === 'current_user_id') {
                compareValue = req.user?.sub;
              }

              // Get field value from record data
              const fieldValue = row.data?.[field];
              
              return evaluateCondition(fieldValue, operator, compareValue);
            
            default:
              return false;
          }
        });
      });
    }
  }

  // If search is provided, filter in-memory for now (simpler approach)
  if (search && search.trim()) {
    const searchableFields = table.fields.filter((f) => f.is_searchable);
    const searchLower = search.toLowerCase();
    filteredRows = filteredRows.filter((row) => {
      return searchableFields.some((field) => {
        const value = row.data?.[field.name];
        if (value && typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        if (value && typeof value === 'number') {
          return value.toString().includes(search);
        }
        return false;
      });
    });
  }

  // Apply column-level filtering for restricted access
  if (allowedColumns && allowedColumns.length > 0) {
    filteredRows = filteredRows.map(row => {
      const filteredData = filterDataColumns(row.data || {}, allowedColumns);
      return {
        ...row.toJSON(),
        data: filteredData,
      };
    });
  }

  // Enrich with related data (only for allowed columns if restricted)
  const enrichedRows = await enrichWithRelatedData(
    filteredRows.map(r => r.toJSON ? r.toJSON() : r), 
    table.fields.filter(f => !allowedColumns || allowedColumns.includes(f.name))
  );

  // Filter out restricted fields from table fields response
  let responseFields = table.fields;
  if (allowedColumns && allowedColumns.length > 0) {
    responseFields = table.fields.filter(f => allowedColumns.includes(f.name));
  }

  return res.status(200).json({
    success: true,
    data: {
      records: enrichedRows,
      total: search || rowFilter ? filteredRows.length : count,
      page: parseInt(page),
      totalPages: Math.ceil((search || rowFilter ? filteredRows.length : count) / parseInt(limit)),
      table: {
        id: table.id,
        name: table.name,
        display_name: table.display_name,
        entry_mode: table.entry_mode || 'inline',
        fields: responseFields,
      },
      _accessInfo: isRestrictedAccess ? {
        level: 'restricted',
        viewOnly: true,
        allowedColumns: allowedColumns || 'all',
        rowFilters: req.tablePermission?.accessRules?.filter(r => r.rule_type === 'row').length || 0,
      } : undefined,
    },
  });
});

// Helper to evaluate condition operators
const evaluateCondition = (fieldValue, operator, compareValue) => {
  if (fieldValue === null || fieldValue === undefined) {
    return operator === '!=' || operator === 'NOT IN';
  }

  switch (operator) {
    case '=':
      return fieldValue === compareValue;
    case '!=':
      return fieldValue !== compareValue;
    case '>':
      return fieldValue > compareValue;
    case '<':
      return fieldValue < compareValue;
    case '>=':
      return fieldValue >= compareValue;
    case '<=':
      return fieldValue <= compareValue;
    case 'IN':
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    case 'NOT IN':
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
    case 'LIKE':
      return typeof fieldValue === 'string' && 
             typeof compareValue === 'string' && 
             fieldValue.includes(compareValue.replace(/%/g, ''));
    case 'ILIKE':
      return typeof fieldValue === 'string' && 
             typeof compareValue === 'string' && 
             fieldValue.toLowerCase().includes(compareValue.replace(/%/g, '').toLowerCase());
    default:
      return false;
  }
};

// GET /custom-data/:tableName/:id - get single record
const getById = asyncHandler(async (req, res) => {
  const { tableName, id } = req.params;

  const table = await getTableByName(tableName);
  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  const record = await CustomTableData.findOne({
    where: {
      id: parseInt(id),
      table_id: table.id,
    },
  });

  if (!record) {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  // Check row-level access for restricted users
  const isRestrictedAccess = req.tablePermission?.accessLevel === 'restricted';
  if (isRestrictedAccess && req.tablePermission?.accessRules) {
    const rowRules = req.tablePermission.accessRules.filter(r => r.rule_type === 'row');
    if (rowRules.length > 0) {
      const hasAccess = rowRules.some(rule => {
        switch (rule.row_filter_type) {
          case 'specific_ids':
            return rule.row_ids && rule.row_ids.includes(record.id);
          case 'created_by':
            return record.created_by === req.user?.sub;
          case 'condition':
            if (!rule.row_condition) return false;
            const { field, operator, value, special } = rule.row_condition;
            let compareValue = value;
            if (special === 'current_user' || special === 'current_user_id') {
              compareValue = req.user?.sub;
            }
            const fieldValue = record.data?.[field];
            return evaluateCondition(fieldValue, operator, compareValue);
          default:
            return false;
        }
      });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this record.',
        });
      }
    }
  }

  // Get allowed columns for restricted access
  const allowedColumns = getAllowedColumns(req.tablePermission);

  // Apply column-level filtering
  let recordData = record.toJSON();
  if (allowedColumns && allowedColumns.length > 0) {
    recordData = {
      ...recordData,
      data: filterDataColumns(recordData.data || {}, allowedColumns),
    };
  }

  // Filter table fields response
  let responseFields = table.fields;
  if (allowedColumns && allowedColumns.length > 0) {
    responseFields = table.fields.filter(f => allowedColumns.includes(f.name));
  }

  // Enrich with related data (only for allowed columns if restricted)
  const [enrichedRecord] = await enrichWithRelatedData(
    [recordData], 
    responseFields
  );

  return res.status(200).json({
    success: true,
    data: {
      record: enrichedRecord,
      table: {
        id: table.id,
        name: table.name,
        display_name: table.display_name,
        entry_mode: table.entry_mode || 'inline',
        fields: responseFields,
      },
      _accessInfo: isRestrictedAccess ? {
        level: 'restricted',
        viewOnly: true,
      } : undefined,
    },
  });
});

// POST /custom-data/:tableName - create new record
const create = asyncHandler(async (req, res) => {
  const { tableName } = req.params;
  const { data } = req.body;

  const table = await getTableByName(tableName);
  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  // Validate required fields
  const requiredFields = table.fields.filter((f) => f.is_required);
  const missingFields = requiredFields.filter(
    (f) => !data || data[f.name] === undefined || data[f.name] === null || data[f.name] === ''
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.map((f) => f.label).join(', ')}`,
    });
  }

  // Validate relation field values
  if (data) {
    const relationErrors = await validateRelationValues(table, data);
    if (relationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: relationErrors.join('; '),
      });
    }
  }

  // Use transaction for atomicity with sync
  const transaction = await sequelize.transaction();

  try {
    // Create the record
    const record = await CustomTableData.create({
      table_id: table.id,
      data: data || {},
      created_by: req.user?.id || null,
    }, { transaction });

    // Perform sync operations if any
    const syncResults = await performSync(table, record, null, data, 'create', transaction);

    await transaction.commit();

    // Enrich with related data
    const [enrichedRecord] = await enrichWithRelatedData([record], table.fields);

    return res.status(201).json({
      success: true,
      message: 'Record created successfully',
      data: enrichedRecord,
      _sync: syncResults.length > 0 ? syncResults : undefined,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// PUT /custom-data/:tableName/:id - update record
const update = asyncHandler(async (req, res) => {
  const { tableName, id } = req.params;
  const { data } = req.body;

  const table = await getTableByName(tableName);
  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  const record = await CustomTableData.findOne({
    where: {
      id: parseInt(id),
      table_id: table.id,
    },
  });

  if (!record) {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  // Validate required fields
  const requiredFields = table.fields.filter((f) => f.is_required);
  const missingFields = requiredFields.filter(
    (f) => !data || data[f.name] === undefined || data[f.name] === null || data[f.name] === ''
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.map((f) => f.label).join(', ')}`,
    });
  }

  // Validate relation field values
  if (data) {
    const relationErrors = await validateRelationValues(table, data);
    if (relationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: relationErrors.join('; '),
      });
    }
  }

  // Store old data for sync comparison
  const oldData = { ...record.data };

  // Use transaction for atomicity with sync
  const transaction = await sequelize.transaction();

  try {
    // Update the record
    await record.update({
      data: data || {},
    }, { transaction });

    // Perform sync operations if any
    const syncResults = await performSync(table, record, oldData, data, 'update', transaction);

    await transaction.commit();

    // Enrich with related data
    const [enrichedRecord] = await enrichWithRelatedData([record], table.fields);

    return res.status(200).json({
      success: true,
      message: 'Record updated successfully',
      data: enrichedRecord,
      _sync: syncResults.length > 0 ? syncResults : undefined,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// DELETE /custom-data/:tableName/:id - delete record
const remove = asyncHandler(async (req, res) => {
  const { tableName, id } = req.params;

  const table = await getTableByName(tableName);
  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  const record = await CustomTableData.findOne({
    where: {
      id: parseInt(id),
      table_id: table.id,
    },
  });

  if (!record) {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  // Use transaction for sync operations
  const transaction = await sequelize.transaction();

  try {
    // Perform sync operations for delete (unlink from related records)
    const syncResults = await performSync(table, record, record.data, null, 'delete', transaction);

    await record.destroy({ transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Record deleted successfully',
      _sync: syncResults.length > 0 ? syncResults : undefined,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// DELETE /custom-data/:tableName/bulk - bulk delete records
const bulkRemove = asyncHandler(async (req, res) => {
  const { tableName } = req.params;
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'ids must be a non-empty array',
    });
  }

  const table = await getTableByName(tableName);
  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  const deleted = await CustomTableData.destroy({
    where: {
      id: { [Op.in]: ids },
      table_id: table.id,
    },
  });

  return res.status(200).json({
    success: true,
    message: `${deleted} records deleted successfully`,
  });
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  bulkRemove,
};
