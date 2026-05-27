'use strict';

/**
 * Migration: Create user_table_permissions table
 * 
 * This table stores granular permissions for each user to access specific tables.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if table exists
      const tables = await queryInterface.showAllTables();
      
      if (!tables.includes('user_table_permissions')) {
        // Create ENUM for table types
        await queryInterface.sequelize.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_user_table_permissions_tableType') THEN
              CREATE TYPE "enum_user_table_permissions_tableType" AS ENUM ('system', 'custom');
            END IF;
          END
          $$;
        `, { transaction });
        
        // Create the table
        await queryInterface.createTable('user_table_permissions', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          userId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          tableType: {
            type: Sequelize.ENUM('system', 'custom'),
            allowNull: false,
          },
          tableName: {
            type: Sequelize.STRING(100),
            allowNull: false,
          },
          canView: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
          },
          canCreate: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          canEdit: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          canDelete: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });
        
        // Add unique constraint
        await queryInterface.addIndex('user_table_permissions', 
          ['userId', 'tableType', 'tableName'], 
          {
            unique: true,
            name: 'unique_user_table_permission',
            transaction,
          }
        );
        
        console.log('✅ Created user_table_permissions table');
      } else {
        console.log('ℹ️ user_table_permissions table already exists');
      }
      
      await transaction.commit();
      console.log('✅ User table permissions migration completed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.dropTable('user_table_permissions', { transaction });
      
      // Drop ENUM type
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS "enum_user_table_permissions_tableType";
      `, { transaction });
      
      await transaction.commit();
      console.log('✅ User table permissions rollback completed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
};
