/**
 * Migration: Add relation and sync field types for column associations
 * 
 * This migration adds support for:
 * 1. 'relation' field type - One-way lookup to another table
 * 2. 'sync' field type - Bidirectional sync between tables
 * 
 * The 'options' JSONB column will store relation configuration:
 * {
 *   "target_table_id": number,
 *   "target_table_name": string,
 *   "display_field": string,       // Field to display in dropdown
 *   "value_field": string,         // Field to use as value (default: id)
 *   "allow_multiple": boolean,     // Allow multiple selections
 *   "sync_mode": "none" | "one_way" | "bidirectional",
 *   "sync_field": string,          // For bidirectional: field in target table to sync with
 *   "cascade_delete": boolean      // Delete related data when parent deleted
 * }
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Adding relation and sync field types...');

      // Step 1: Add new ENUM values to custom_fields.type column
      // PostgreSQL requires creating a new type and migrating
      
      // First, get the current ENUM type name
      const [enumResult] = await queryInterface.sequelize.query(
        `SELECT pg_type.typname AS enumtype, pg_enum.enumlabel AS enumlabel
         FROM pg_type 
         JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
         WHERE pg_type.typname LIKE 'enum_custom_fields_type%'
         LIMIT 1;`,
        { transaction }
      );

      if (enumResult.length === 0) {
        // ENUM might have a different name, try alternative approach
        console.log('Using alternative ENUM update approach...');
        
        // Add new values to existing ENUM
        await queryInterface.sequelize.query(
          `ALTER TYPE "enum_custom_fields_type" ADD VALUE IF NOT EXISTS 'relation';`,
          { transaction }
        );
        
        await queryInterface.sequelize.query(
          `ALTER TYPE "enum_custom_fields_type" ADD VALUE IF NOT EXISTS 'sync';`,
          { transaction }
        );
      } else {
        const enumTypeName = enumResult[0].enumtype;
        console.log(`Found ENUM type: ${enumTypeName}`);
        
        // Add new values
        await queryInterface.sequelize.query(
          `ALTER TYPE "${enumTypeName}" ADD VALUE IF NOT EXISTS 'relation';`,
          { transaction }
        );
        
        await queryInterface.sequelize.query(
          `ALTER TYPE "${enumTypeName}" ADD VALUE IF NOT EXISTS 'sync';`,
          { transaction }
        );
      }

      console.log('✅ Added relation and sync field types');

      // Step 2: Create field_relations table for tracking relationships
      // This provides better querying capabilities than just using options JSONB
      await queryInterface.createTable('field_relations', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        source_field_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'custom_fields',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        source_table_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'custom_tables',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        target_table_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'custom_tables',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        target_field_id: {
          type: Sequelize.INTEGER,
          allowNull: true, // Optional: specific field to link to
          references: {
            model: 'custom_fields',
            key: 'id',
          },
          onDelete: 'SET NULL',
        },
        display_field_id: {
          type: Sequelize.INTEGER,
          allowNull: true, // Field to show in dropdown
          references: {
            model: 'custom_fields',
            key: 'id',
          },
          onDelete: 'SET NULL',
        },
        relation_type: {
          type: Sequelize.ENUM('lookup', 'one_way_sync', 'bidirectional_sync'),
          allowNull: false,
          defaultValue: 'lookup',
        },
        allow_multiple: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        cascade_delete: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        sync_on_create: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        sync_on_update: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        sync_on_delete: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
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

      console.log('✅ Created field_relations table');

      await transaction.commit();
      console.log('\n✅ Migration completed successfully!');
      
      // Step 3: Add indexes OUTSIDE transaction (so errors don't abort everything)
      console.log('\nAdding indexes...');
      
      try {
        await queryInterface.addIndex('field_relations', ['source_field_id'], {
          name: 'idx_field_relations_source_field',
        });
        console.log('✅ Created index: idx_field_relations_source_field');
      } catch (err) {
        if (err.original?.code === '42P07') {
          console.log('⏭️  Index idx_field_relations_source_field already exists, skipping');
        } else {
          throw err;
        }
      }

      try {
        await queryInterface.addIndex('field_relations', ['target_table_id'], {
          name: 'idx_field_relations_target_table',
        });
        console.log('✅ Created index: idx_field_relations_target_table');
      } catch (err) {
        if (err.original?.code === '42P07') {
          console.log('⏭️  Index idx_field_relations_target_table already exists, skipping');
        } else {
          throw err;
        }
      }

      try {
        await queryInterface.addIndex('field_relations', ['source_table_id', 'target_table_id'], {
          name: 'idx_field_relations_table_pair',
        });
        console.log('✅ Created index: idx_field_relations_table_pair');
      } catch (err) {
        if (err.original?.code === '42P07') {
          console.log('⏭️  Index idx_field_relations_table_pair already exists, skipping');
        } else {
          throw err;
        }
      }

      console.log('✅ All indexes ready');
      console.log('\nNew field types available:');
      console.log('  - relation: One-way lookup to another table');
      console.log('  - sync: Bidirectional sync between tables');
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Rolling back relation and sync field types...');

      // Step 1: Remove any fields using these types
      await queryInterface.sequelize.query(
        `DELETE FROM custom_fields WHERE type IN ('relation', 'sync');`,
        { transaction }
      );

      console.log('✅ Removed fields using relation/sync types');

      // Step 2: Drop field_relations table
      await queryInterface.dropTable('field_relations', { transaction });
      console.log('✅ Dropped field_relations table');

      // Note: Removing ENUM values from PostgreSQL is complex and may not be necessary
      // The values will just not be used anymore

      await transaction.commit();
      console.log('\n✅ Rollback completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  },
};
