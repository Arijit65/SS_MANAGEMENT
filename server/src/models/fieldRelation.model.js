const { DataTypes } = require('sequelize');

/**
 * FieldRelation model - Tracks relationships between custom table fields
 * 
 * This model stores metadata about field-to-field relationships,
 * enabling lookup fields and bidirectional sync between custom tables.
 */
module.exports = (sequelize) => {
  const FieldRelation = sequelize.define(
    'FieldRelation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      source_field_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'custom_fields',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'The field that holds the relation',
      },
      source_table_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'custom_tables',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'The table containing the source field',
      },
      target_table_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'custom_tables',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'The table being referenced/linked to',
      },
      target_field_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'custom_fields',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'Optional: specific field in target table for sync',
      },
      display_field_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'custom_fields',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'Field from target table to display in dropdown',
      },
      relation_type: {
        type: DataTypes.ENUM('lookup', 'one_way_sync', 'bidirectional_sync'),
        allowNull: false,
        defaultValue: 'lookup',
        comment: 'lookup: simple FK, one_way_sync: source→target, bidirectional_sync: both ways',
      },
      allow_multiple: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Allow selecting multiple related records',
      },
      cascade_delete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Delete related records when parent is deleted',
      },
      sync_on_create: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Sync data when new record is created',
      },
      sync_on_update: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Sync data when record is updated',
      },
      sync_on_delete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Sync deletion to related records',
      },
    },
    {
      tableName: 'field_relations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          name: 'idx_field_relations_source_field',
          fields: ['source_field_id'],
        },
        {
          name: 'idx_field_relations_target_table',
          fields: ['target_table_id'],
        },
        {
          name: 'idx_field_relations_table_pair',
          fields: ['source_table_id', 'target_table_id'],
        },
      ],
    }
  );

  // Relation types enum for use elsewhere
  FieldRelation.RELATION_TYPES = {
    LOOKUP: 'lookup',
    ONE_WAY_SYNC: 'one_way_sync',
    BIDIRECTIONAL_SYNC: 'bidirectional_sync',
  };

  return FieldRelation;
};
