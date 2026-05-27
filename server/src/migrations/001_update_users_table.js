'use strict';

/**
 * Migration: Setup users table with role-based authentication fields
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Starting users table migration...');
    
    // Check existing columns
    const [columns] = await queryInterface.sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    const existingColumns = columns.map(c => c.column_name);
    console.log('📋 Current columns:', existingColumns.join(', '));

    // Add mobile if missing
    if (!existingColumns.includes('mobile')) {
      await queryInterface.sequelize.query(`ALTER TABLE users ADD COLUMN mobile VARCHAR(20)`);
      console.log('✅ Added: mobile');
    }

    // Add isActive if missing  
    if (!existingColumns.includes('isActive')) {
      await queryInterface.sequelize.query(`ALTER TABLE users ADD COLUMN "isActive" BOOLEAN DEFAULT true NOT NULL`);
      console.log('✅ Added: isActive');
    }

    // Add createdBy if missing
    if (!existingColumns.includes('createdBy')) {
      await queryInterface.sequelize.query(`ALTER TABLE users ADD COLUMN "createdBy" UUID`);
      console.log('✅ Added: createdBy');
    }

    // Change role column to VARCHAR if it's an ENUM
    const [roleType] = await queryInterface.sequelize.query(`
      SELECT data_type, udt_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `);
    
    if (roleType[0] && roleType[0].data_type === 'USER-DEFINED') {
      console.log('🔄 Converting role from ENUM to VARCHAR...');
      await queryInterface.sequelize.query(`
        ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text
      `);
      console.log('✅ Converted role to VARCHAR');
    }

    // Set default role value for any nulls
    await queryInterface.sequelize.query(`
      UPDATE users SET role = 'content_writer' WHERE role IS NULL
    `);

    console.log('✅ Users table migration complete');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back users table migration...');
    
    const [columns] = await queryInterface.sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    const existingColumns = columns.map(c => c.column_name);

    if (existingColumns.includes('mobile')) {
      await queryInterface.sequelize.query('ALTER TABLE users DROP COLUMN mobile');
    }
    if (existingColumns.includes('isActive')) {
      await queryInterface.sequelize.query('ALTER TABLE users DROP COLUMN "isActive"');
    }
    if (existingColumns.includes('createdBy')) {
      await queryInterface.sequelize.query('ALTER TABLE users DROP COLUMN "createdBy"');
    }

    console.log('✅ Rollback complete');
  }
};
