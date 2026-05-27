/**
 * Create Admin Credential Script
 */

const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
const env = require('../config/env');

const ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || 'admin@smritisudha.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@123',
  fullName: process.env.ADMIN_NAME || 'System Admin',
};

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'postgres',
  logging: false,
});

const createAdmin = async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('              CREATE ADMIN CREDENTIAL');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Check existing columns
    const [columns] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    const columnNames = columns.map(c => c.column_name);
    console.log('📋 Columns in users table:', columnNames.join(', '));
    
    // Check if admin exists
    const [existing] = await sequelize.query(
      `SELECT id, email FROM users WHERE email = $1`,
      { bind: [ADMIN_CONFIG.email] }
    );
    
    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 10);
    
    if (existing.length > 0) {
      console.log(`\n⚠️  Admin exists. Updating password...`);
      
      // Build update query based on available columns
      let updateQuery = `UPDATE users SET password = $1`;
      const binds = [hashedPassword];
      
      if (columnNames.includes('isActive')) {
        updateQuery += `, "isActive" = true`;
      }
      
      updateQuery += ` WHERE email = $2`;
      binds.push(ADMIN_CONFIG.email);
      
      await sequelize.query(updateQuery, { bind: binds });
      console.log('✅ Admin password updated\n');
    } else {
      console.log('\n📝 Creating new admin...');
      
      const uuid = require('crypto').randomUUID();
      
      // Build insert based on available columns
      let cols = ['id', '"fullName"', 'email', 'password', 'role', '"createdAt"', '"updatedAt"'];
      let vals = [uuid, ADMIN_CONFIG.fullName, ADMIN_CONFIG.email, hashedPassword, 'admin'];
      let placeholders = ['$1', '$2', '$3', '$4', '$5', 'NOW()', 'NOW()'];
      
      if (columnNames.includes('isActive')) {
        cols.splice(5, 0, '"isActive"');
        vals.push(true);
        placeholders.splice(5, 0, `$${vals.length}`);
      }
      
      const query = `INSERT INTO users (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;
      await sequelize.query(query, { bind: vals });
      console.log('✅ Admin created\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   Email:    ' + ADMIN_CONFIG.email);
    console.log('   Password: ' + ADMIN_CONFIG.password);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

createAdmin();
