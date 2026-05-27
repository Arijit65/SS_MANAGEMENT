/**
 * Migration: Add entry_mode to custom_tables
 *
 * Adds a column that lets the admin choose between:
 *   'inline' – new/edit records are handled directly as editable table rows (default)
 *   'form'   – new/edit records open the dedicated full-page form
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('Adding entry_mode column to custom_tables...');

      const tableDesc = await queryInterface.describeTable('custom_tables');
      if (tableDesc.entry_mode) {
        console.log('⏭️  entry_mode column already exists, skipping');
        await transaction.commit();
        return;
      }

      await queryInterface.addColumn(
        'custom_tables',
        'entry_mode',
        {
          type: Sequelize.STRING(10),
          allowNull: false,
          defaultValue: 'inline',
        },
        { transaction }
      );

      console.log('✅ Added entry_mode column (default: inline)');

      await transaction.commit();
      console.log('\n✅ Migration 006 completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration 006 failed:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('custom_tables', 'entry_mode', { transaction });
      await transaction.commit();
      console.log('✅ Rollback 006: removed entry_mode column');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
