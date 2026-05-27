/**
 * Check Users Table Structure
 * 
 * Displays the actual column names in the users table
 */

const { Sequelize } = require('sequelize');
const env = require('../config/env');

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'postgres',
  logging: false,
});

const checkTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');
    
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Users table structure:');
    console.log('════════════════════════════════════════════════════════');
    columns.forEach(col => {
      console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('════════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkTable();
