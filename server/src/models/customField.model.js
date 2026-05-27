const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CustomField = sequelize.define(
    'CustomField',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      table_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'custom_tables',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          is: /^[a-z0-9_]+$/i, // field name: alphanumeric and underscores only
        },
      },
      label: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          'text',
          'textarea',
          'number',
          'email',
          'phone',
          'date',
          'select',
          'checkbox',
          'url',
          'file',
          'richtext',
          'multiselect',
          'daterange',
          'color',
          'json',
          'relation',  // One-way lookup to another table
          'sync'       // Bidirectional sync between tables
        ),
        allowNull: false,
        defaultValue: 'text',
      },
      options: {
        // For select/multiselect: array of { label, value }
        // For relation/sync: { target_table_id, display_field, allow_multiple, sync_mode, etc. }
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_searchable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      show_in_list: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      field_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      placeholder: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      default_value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      validation: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: 'custom_fields',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['table_id', 'name'],
        },
      ],
    }
  );

  // Relation field types that require special handling
  CustomField.RELATION_TYPES = ['relation', 'sync'];
  
  // Helper to check if a field type is a relation type
  CustomField.isRelationType = (type) => CustomField.RELATION_TYPES.includes(type);

  return CustomField;
};
