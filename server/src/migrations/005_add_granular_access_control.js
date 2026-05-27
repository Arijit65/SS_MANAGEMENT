/**
 * Migration: Add granular access control for table permissions
 * 
 * This migration adds support for:
 * 1. Row-level access control (specific IDs, conditions, created_by)
 * 2. Column-level access control (hide specific columns)
 * 3. Access levels (full vs restricted)
 * 
 * Restricted access is VIEW-ONLY and rules combine with OR logic.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Adding granular access control...');

      // Step 1: Add access_level column to user_table_permissions
      console.log('Adding access_level column to user_table_permissions...');
      
      // Create the ENUM type first
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
          CREATE TYPE "enum_user_table_permissions_access_level" AS ENUM ('full', 'restricted');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;`,
        { transaction }
      );

      // Check if column already exists
      const [columns] = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'user_table_permissions' AND column_name = 'access_level'`,
        { transaction }
      );

      if (columns.length === 0) {
        await queryInterface.addColumn('user_table_permissions', 'access_level', {
          type: Sequelize.ENUM('full', 'restricted'),
          allowNull: false,
          defaultValue: 'full',
        }, { transaction });
        console.log('✅ Added access_level column');
      } else {
        console.log('⏭️  access_level column already exists, skipping');
      }

      // Step 2: Create row_filter_type ENUM
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
          CREATE TYPE "enum_table_access_rules_row_filter_type" AS ENUM ('specific_ids', 'condition', 'created_by');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;`,
        { transaction }
      );

      // Step 3: Create rule_type ENUM
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
          CREATE TYPE "enum_table_access_rules_rule_type" AS ENUM ('row', 'column');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;`,
        { transaction }
      );

      // Step 4: Create table_access_rules table
      console.log('Creating table_access_rules table...');
      
      await queryInterface.createTable('table_access_rules', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        permission_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'user_table_permissions',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        rule_type: {
          type: Sequelize.ENUM('row', 'column'),
          allowNull: false,
        },
        // For row rules
        row_filter_type: {
          type: Sequelize.ENUM('specific_ids', 'condition', 'created_by'),
          allowNull: true,
        },
        row_ids: {
          type: Sequelize.ARRAY(Sequelize.INTEGER),
          allowNull: true,
          comment: 'For specific_ids filter: array of record IDs user can access',
        },
        row_condition: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'For condition filter: {field, operator, value} or {field, operator, special} where special can be "current_user"',
        },
        // For column rules
        allowed_columns: {
          type: Sequelize.ARRAY(Sequelize.TEXT),
          allowNull: true,
          comment: 'List of column names the user CAN see (whitelist)',
        },
        // Metadata
        description: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'Optional description of what this rule does',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      }, { transaction });

      console.log('✅ Created table_access_rules table');

      // Step 5: Add indexes (using IF NOT EXISTS for idempotency)
      console.log('Creating indexes...');
      
      await queryInterface.sequelize.query(
        'CREATE INDEX IF NOT EXISTS "idx_table_access_rules_permission" ON "table_access_rules" ("permission_id")',
        { transaction }
      );

      await queryInterface.sequelize.query(
        'CREATE INDEX IF NOT EXISTS "idx_table_access_rules_type" ON "table_access_rules" ("rule_type")',
        { transaction }
      );

      await queryInterface.sequelize.query(
        'CREATE INDEX IF NOT EXISTS "idx_table_access_rules_permission_type" ON "table_access_rules" ("permission_id", "rule_type")',
        { transaction }
      );

      console.log('✅ Created indexes');

      await transaction.commit();
      
      console.log('\n✅ Migration completed successfully!');
      console.log('\nNew features available:');
      console.log('  - access_level: "full" (default) or "restricted"');
      console.log('  - Row rules: specific_ids, condition, or created_by');
      console.log('  - Column rules: whitelist of allowed columns');
      console.log('  - Multiple rules combine with OR logic');
      console.log('  - Restricted access is VIEW ONLY');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Rolling back granular access control...');

      // Drop the table_access_rules table
      await queryInterface.dropTable('table_access_rules', { transaction });
      console.log('✅ Dropped table_access_rules table');

      // Remove access_level column
      await queryInterface.removeColumn('user_table_permissions', 'access_level', { transaction });
      console.log('✅ Removed access_level column');

      // Drop ENUM types
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_user_table_permissions_access_level";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_table_access_rules_row_filter_type";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_table_access_rules_rule_type";',
        { transaction }
      );
      console.log('✅ Dropped ENUM types');

      await transaction.commit();
      console.log('\n✅ Rollback completed successfully!');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  },
};
