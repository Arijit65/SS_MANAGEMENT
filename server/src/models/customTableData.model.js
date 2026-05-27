const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CustomTableData = sequelize.define(
    'CustomTableData',
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
      data: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'custom_table_data',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['table_id'],
        },
      ],
    }
  );

  return CustomTableData;
};
