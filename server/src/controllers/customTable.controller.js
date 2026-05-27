const { Op } = require('sequelize');
const { CustomTable, CustomField, CustomTableData, FieldRelation, sequelize } = require('../models');
const asyncHandler = require('../utils/async-handler');

// Relation field types that require special validation
const RELATION_TYPES = ['relation', 'sync'];

// Helper to validate relation field options
const validateRelationOptions = async (options, sourceTableId) => {
  if (!options || typeof options !== 'object') {
    return { valid: false, error: 'Relation fields require options configuration' };
  }

  const { target_table_id, display_field, relation_type } = options;

  if (!target_table_id) {
    return { valid: false, error: 'Target table is required for relation fields' };
  }

  // Check target table exists
  const targetTable = await CustomTable.findByPk(target_table_id);
  if (!targetTable) {
    return { valid: false, error: 'Target table not found' };
  }

  // Prevent self-reference for lookup (allowed for sync)
  if (relation_type !== 'bidirectional_sync' && target_table_id === sourceTableId) {
    return { valid: false, error: 'Cannot create lookup relation to same table' };
  }

  // Validate display field if specified
  if (display_field) {
    const displayFieldExists = await CustomField.findOne({
      where: { table_id: target_table_id, name: display_field }
    });
    if (!displayFieldExists) {
      return { valid: false, error: `Display field "${display_field}" not found in target table` };
    }
  }

  return { valid: true, targetTable };
};

// Helper to create/update FieldRelation record
const upsertFieldRelation = async (fieldId, sourceTableId, options, transaction = null) => {
  const {
    target_table_id,
    display_field,
    target_field,
    relation_type = 'lookup',
    allow_multiple = false,
    cascade_delete = false,
    sync_on_create = true,
    sync_on_update = true,
    sync_on_delete = false,
  } = options;

  // Get display_field_id if specified
  let displayFieldId = null;
  if (display_field) {
    const df = await CustomField.findOne({
      where: { table_id: target_table_id, name: display_field },
      transaction,
    });
    displayFieldId = df?.id || null;
  }

  // Get target_field_id if specified
  let targetFieldId = null;
  if (target_field) {
    const tf = await CustomField.findOne({
      where: { table_id: target_table_id, name: target_field },
      transaction,
    });
    targetFieldId = tf?.id || null;
  }

  // Upsert the relation
  const [relation, created] = await FieldRelation.upsert({
    source_field_id: fieldId,
    source_table_id: sourceTableId,
    target_table_id,
    target_field_id: targetFieldId,
    display_field_id: displayFieldId,
    relation_type,
    allow_multiple,
    cascade_delete,
    sync_on_create,
    sync_on_update,
    sync_on_delete,
  }, {
    transaction,
    returning: true,
  });

  return relation;
};

// GET /custom-tables - list all custom tables
const getAll = asyncHandler(async (req, res) => {
  const { include_archived } = req.query;

  const where = {};
  if (include_archived !== 'true') {
    where.is_archived = false;
  }

  const tables = await CustomTable.findAll({
    where,
    include: [
      {
        model: CustomField,
        as: 'fields',
        attributes: ['id', 'name', 'label', 'type'],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  // Add record count for each table
  const tablesWithCounts = await Promise.all(
    tables.map(async (table) => {
      const recordCount = await CustomTableData.count({
        where: { table_id: table.id },
      });
      return {
        ...table.toJSON(),
        record_count: recordCount,
        field_count: table.fields.length,
      };
    })
  );

  return res.status(200).json({
    success: true,
    data: tablesWithCounts,
  });
});

// GET /custom-tables/:id - get single table with all fields
const getById = asyncHandler(async (req, res) => {
  const table = await CustomTable.findByPk(req.params.id, {
    include: [
      {
        model: CustomField,
        as: 'fields',
        order: [['field_order', 'ASC']],
      },
    ],
  });

  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  const recordCount = await CustomTableData.count({
    where: { table_id: table.id },
  });

  return res.status(200).json({
    success: true,
    data: {
      ...table.toJSON(),
      record_count: recordCount,
    },
  });
});

// GET /custom-tables/by-name/:name - get table by name (for frontend routing)
const getByName = asyncHandler(async (req, res) => {
  const table = await CustomTable.findOne({
    where: {
      name: req.params.name,
      is_archived: false,
    },
    include: [
      {
        model: CustomField,
        as: 'fields',
        order: [['field_order', 'ASC']],
      },
    ],
  });

  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  return res.status(200).json({
    success: true,
    data: table,
  });
});

// POST /custom-tables - create new table with fields
const create = asyncHandler(async (req, res) => {
  const { name, display_name, description, icon, entry_mode, fields } = req.body;

  // Validate required fields
  if (!name || !display_name) {
    return res.status(400).json({
      success: false,
      message: 'Name and display_name are required',
    });
  }

  // Validate name format (slug)
  if (!/^[a-z0-9-]+$/.test(name)) {
    return res.status(400).json({
      success: false,
      message: 'Name must be lowercase alphanumeric with hyphens only',
    });
  }

  // Check if name already exists
  const existing = await CustomTable.findOne({ where: { name } });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'A table with this name already exists',
    });
  }

  // Pre-validate relation fields before creating anything
  if (fields && Array.isArray(fields)) {
    for (const field of fields) {
      if (RELATION_TYPES.includes(field.type)) {
        const validation = await validateRelationOptions(field.options, null);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: `Field "${field.name}": ${validation.error}`,
          });
        }
      }
    }
  }

  // Use transaction for atomicity
  const transaction = await sequelize.transaction();

  try {
    // Create the table
    const table = await CustomTable.create({
      name,
      display_name,
      description,
      icon: icon || 'FileText',
      entry_mode: entry_mode || 'inline',
      created_by: req.user?.id || null,
    }, { transaction });

    // Create fields if provided
    if (fields && Array.isArray(fields) && fields.length > 0) {
      const fieldsToCreate = fields.map((field, index) => ({
        ...field,
        table_id: table.id,
        field_order: field.field_order ?? index,
      }));

      const createdFields = await CustomField.bulkCreate(fieldsToCreate, { 
        transaction,
        returning: true,
      });

      // Create FieldRelation records for relation/sync fields
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if (RELATION_TYPES.includes(field.type) && field.options) {
          const createdField = createdFields[i];
          await upsertFieldRelation(createdField.id, table.id, field.options, transaction);
        }
      }
    }

    await transaction.commit();

    // Fetch the created table with fields and relations
    const createdTable = await CustomTable.findByPk(table.id, {
      include: [{ 
        model: CustomField, 
        as: 'fields',
        include: [{
          model: FieldRelation,
          as: 'relation',
          include: [
            { model: CustomTable, as: 'targetTable', attributes: ['id', 'name', 'display_name'] },
            { model: CustomField, as: 'displayField', attributes: ['id', 'name', 'label'] },
          ]
        }]
      }],
    });

    return res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: createdTable,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// PUT /custom-tables/:id - update table metadata
const update = asyncHandler(async (req, res) => {
  const table = await CustomTable.findByPk(req.params.id);

  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  const { display_name, description, icon, is_active, entry_mode } = req.body;

  await table.update({
    display_name: display_name ?? table.display_name,
    description: description ?? table.description,
    icon: icon ?? table.icon,
    is_active: is_active ?? table.is_active,
    entry_mode: entry_mode ?? table.entry_mode,
  });

  return res.status(200).json({
    success: true,
    message: 'Table updated successfully',
    data: table,
  });
});

// POST /custom-tables/:id/archive - archive (soft delete) table
const archive = asyncHandler(async (req, res) => {
  const table = await CustomTable.findByPk(req.params.id);

  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  await table.update({
    is_archived: true,
    archived_at: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: 'Table archived successfully',
    data: table,
  });
});

// POST /custom-tables/:id/restore - restore archived table
const restore = asyncHandler(async (req, res) => {
  const table = await CustomTable.findByPk(req.params.id);

  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  await table.update({
    is_archived: false,
    archived_at: null,
  });

  return res.status(200).json({
    success: true,
    message: 'Table restored successfully',
    data: table,
  });
});

// DELETE /custom-tables/:id - permanently delete table (admin only)
const remove = asyncHandler(async (req, res) => {
  const table = await CustomTable.findByPk(req.params.id);

  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  // This will cascade delete fields and data due to foreign key constraints
  await table.destroy();

  return res.status(200).json({
    success: true,
    message: 'Table and all its data permanently deleted',
  });
});

// ============ Field Management ============

// GET /custom-tables/:tableId/fields - list all fields for a table
const getFields = asyncHandler(async (req, res) => {
  const fields = await CustomField.findAll({
    where: { table_id: req.params.tableId },
    include: [{
      model: FieldRelation,
      as: 'relation',
      include: [
        { model: CustomTable, as: 'targetTable', attributes: ['id', 'name', 'display_name'] },
        { model: CustomField, as: 'displayField', attributes: ['id', 'name', 'label'] },
      ]
    }],
    order: [['field_order', 'ASC']],
  });

  return res.status(200).json({
    success: true,
    data: fields,
  });
});

// POST /custom-tables/:tableId/fields - add field to table
const addField = asyncHandler(async (req, res) => {
  const table = await CustomTable.findByPk(req.params.tableId);

  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  const { name, label, type, options, is_required, is_searchable, show_in_list, placeholder, default_value, validation } = req.body;

  // Validate field name format
  if (!/^[a-z0-9_]+$/.test(name)) {
    return res.status(400).json({
      success: false,
      message: 'Field name must be lowercase alphanumeric with underscores only',
    });
  }

  // Check if field name already exists in this table
  const existing = await CustomField.findOne({
    where: { table_id: req.params.tableId, name },
  });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'A field with this name already exists in this table',
    });
  }

  // Validate relation field options if applicable
  if (RELATION_TYPES.includes(type)) {
    const validation = await validateRelationOptions(options, parseInt(req.params.tableId));
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }
  }

  const transaction = await sequelize.transaction();

  try {
    // Get the max field_order
    const maxOrder = await CustomField.max('field_order', {
      where: { table_id: req.params.tableId },
    });

    const field = await CustomField.create({
      table_id: req.params.tableId,
      name,
      label,
      type: type || 'text',
      options,
      is_required: is_required || false,
      is_searchable: is_searchable || false,
      show_in_list: show_in_list !== false,
      field_order: (maxOrder || 0) + 1,
      placeholder,
      default_value,
      validation,
    }, { transaction });

    // Create FieldRelation if this is a relation/sync field
    if (RELATION_TYPES.includes(type) && options) {
      await upsertFieldRelation(field.id, parseInt(req.params.tableId), options, transaction);
    }

    await transaction.commit();

    // Fetch field with relation data
    const createdField = await CustomField.findByPk(field.id, {
      include: [{
        model: FieldRelation,
        as: 'relation',
        include: [
          { model: CustomTable, as: 'targetTable', attributes: ['id', 'name', 'display_name'] },
          { model: CustomField, as: 'displayField', attributes: ['id', 'name', 'label'] },
        ]
      }],
    });

    return res.status(201).json({
      success: true,
      message: 'Field added successfully',
      data: createdField,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// PUT /custom-tables/:tableId/fields/:fieldId - update field
const updateField = asyncHandler(async (req, res) => {
  const field = await CustomField.findOne({
    where: {
      id: req.params.fieldId,
      table_id: req.params.tableId,
    },
  });

  if (!field) {
    return res.status(404).json({ success: false, message: 'Field not found' });
  }

  const {
    label, type, options, is_required, is_searchable,
    show_in_list, field_order, placeholder, default_value, validation,
  } = req.body;

  // Validate relation field options if type is relation/sync
  const newType = type ?? field.type;
  const newOptions = options ?? field.options;
  
  if (RELATION_TYPES.includes(newType)) {
    const validationResult = await validateRelationOptions(newOptions, parseInt(req.params.tableId));
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: validationResult.error,
      });
    }
  }

  const transaction = await sequelize.transaction();

  try {
    await field.update({
      label: label ?? field.label,
      type: type ?? field.type,
      options: options ?? field.options,
      is_required: is_required ?? field.is_required,
      is_searchable: is_searchable ?? field.is_searchable,
      show_in_list: show_in_list ?? field.show_in_list,
      field_order: field_order ?? field.field_order,
      placeholder: placeholder ?? field.placeholder,
      default_value: default_value ?? field.default_value,
      validation: validation ?? field.validation,
    }, { transaction });

    // Update or create FieldRelation if this is a relation/sync field
    if (RELATION_TYPES.includes(newType) && newOptions) {
      await upsertFieldRelation(field.id, parseInt(req.params.tableId), newOptions, transaction);
    } else if (!RELATION_TYPES.includes(newType)) {
      // If type changed from relation to non-relation, remove the relation
      await FieldRelation.destroy({
        where: { source_field_id: field.id },
        transaction,
      });
    }

    await transaction.commit();

    // Fetch updated field with relation data
    const updatedField = await CustomField.findByPk(field.id, {
      include: [{
        model: FieldRelation,
        as: 'relation',
        include: [
          { model: CustomTable, as: 'targetTable', attributes: ['id', 'name', 'display_name'] },
          { model: CustomField, as: 'displayField', attributes: ['id', 'name', 'label'] },
        ]
      }],
    });

    return res.status(200).json({
      success: true,
      message: 'Field updated successfully',
      data: updatedField,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// DELETE /custom-tables/:tableId/fields/:fieldId - remove field
const removeField = asyncHandler(async (req, res) => {
  const field = await CustomField.findOne({
    where: {
      id: req.params.fieldId,
      table_id: req.params.tableId,
    },
  });

  if (!field) {
    return res.status(404).json({ success: false, message: 'Field not found' });
  }

  await field.destroy();

  return res.status(200).json({
    success: true,
    message: 'Field removed successfully',
  });
});

// PUT /custom-tables/:tableId/fields/reorder - reorder fields
const reorderFields = asyncHandler(async (req, res) => {
  const { field_orders } = req.body; // Array of { id, field_order }

  if (!Array.isArray(field_orders)) {
    return res.status(400).json({
      success: false,
      message: 'field_orders must be an array',
    });
  }

  await Promise.all(
    field_orders.map(({ id, field_order }) =>
      CustomField.update(
        { field_order },
        { where: { id, table_id: req.params.tableId } }
      )
    )
  );

  const fields = await CustomField.findAll({
    where: { table_id: req.params.tableId },
    order: [['field_order', 'ASC']],
  });

  return res.status(200).json({
    success: true,
    message: 'Fields reordered successfully',
    data: fields,
  });
});

// ============ Relation Field Support ============

// GET /custom-tables/:tableId/fields/:fieldId/relation-options - fetch options for a relation field
const getRelationOptions = asyncHandler(async (req, res) => {
  const { tableId, fieldId } = req.params;
  const { search, limit = 50, offset = 0 } = req.query;

  // Get the field with its relation
  const field = await CustomField.findOne({
    where: {
      id: fieldId,
      table_id: tableId,
    },
    include: [{
      model: FieldRelation,
      as: 'relation',
      include: [
        { model: CustomTable, as: 'targetTable' },
        { model: CustomField, as: 'displayField' },
      ]
    }],
  });

  if (!field) {
    return res.status(404).json({ success: false, message: 'Field not found' });
  }

  if (!field.relation) {
    return res.status(400).json({ 
      success: false, 
      message: 'This field is not a relation field' 
    });
  }

  const { targetTable, displayField } = field.relation;
  const displayFieldName = displayField?.name || 'id';

  // Fetch records from target table
  const whereClause = { table_id: targetTable.id };

  // Get target table fields for search
  const targetFields = await CustomField.findAll({
    where: { table_id: targetTable.id },
    attributes: ['name'],
  });
  const searchableFieldNames = targetFields.map(f => f.name);

  // Fetch records
  const records = await CustomTableData.findAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']],
  });

  // Format records for dropdown display
  const options = records.map(record => {
    const data = record.data || {};
    let displayValue = data[displayFieldName] || data.name || data.title || `Record #${record.id}`;
    
    // If search is provided, filter results
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch = searchableFieldNames.some(fieldName => {
        const value = data[fieldName];
        return value && String(value).toLowerCase().includes(searchLower);
      });
      if (!matchesSearch) return null;
    }

    return {
      id: record.id,
      value: record.id,
      label: String(displayValue),
      data: data, // Include full data for display purposes
    };
  }).filter(Boolean);

  // Get total count for pagination
  const total = await CustomTableData.count({ where: whereClause });

  return res.status(200).json({
    success: true,
    data: {
      options,
      target_table: {
        id: targetTable.id,
        name: targetTable.name,
        display_name: targetTable.display_name,
      },
      display_field: displayFieldName,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    },
  });
});

// GET /custom-tables/:tableId/relations - get all relations for a table
const getTableRelations = asyncHandler(async (req, res) => {
  const { tableId } = req.params;

  // Get outgoing relations (fields in this table that point to other tables)
  const outgoingRelations = await FieldRelation.findAll({
    where: { source_table_id: tableId },
    include: [
      { model: CustomField, as: 'sourceField', attributes: ['id', 'name', 'label', 'type'] },
      { model: CustomTable, as: 'targetTable', attributes: ['id', 'name', 'display_name'] },
      { model: CustomField, as: 'displayField', attributes: ['id', 'name', 'label'] },
    ],
  });

  // Get incoming relations (fields in other tables that point to this table)
  const incomingRelations = await FieldRelation.findAll({
    where: { target_table_id: tableId },
    include: [
      { model: CustomField, as: 'sourceField', attributes: ['id', 'name', 'label', 'type'] },
      { model: CustomTable, as: 'sourceTable', attributes: ['id', 'name', 'display_name'] },
      { model: CustomField, as: 'displayField', attributes: ['id', 'name', 'label'] },
    ],
  });

  return res.status(200).json({
    success: true,
    data: {
      outgoing: outgoingRelations,
      incoming: incomingRelations,
    },
  });
});

// GET /custom-tables/available-for-relation - get all tables available for relation
const getTablesForRelation = asyncHandler(async (req, res) => {
  // First, get all active tables with ALL their fields
  // We need ALL fields so the frontend can:
  // 1. Show non-relation/sync fields as display field options
  // 2. Show relation/sync fields as target sync field options
  const tables = await CustomTable.findAll({
    where: {
      is_archived: false,
      is_active: true,
    },
    include: [{
      model: CustomField,
      as: 'fields',
      attributes: ['id', 'name', 'label', 'type'],
      required: false,
      order: [['field_order', 'ASC']],
    }],
    order: [
      ['display_name', 'ASC'],
      [{ model: CustomField, as: 'fields' }, 'field_order', 'ASC'],
    ],
  });

  return res.status(200).json({
    success: true,
    data: tables,
  });
});

module.exports = {
  getAll,
  getById,
  getByName,
  create,
  update,
  archive,
  restore,
  remove,
  getFields,
  addField,
  updateField,
  removeField,
  reorderFields,
  // Relation endpoints
  getRelationOptions,
  getTableRelations,
  getTablesForRelation,
};
