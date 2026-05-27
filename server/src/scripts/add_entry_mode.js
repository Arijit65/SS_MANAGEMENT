/**
 * Standalone script to add entry_mode column to custom_tables.
 * Run with: node src/scripts/add_entry_mode.js
 */
const { Sequelize } = require('sequelize');
const env = require('../config/env');

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'postgres',
  logging: false,
});

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Check if column already exists
    const [rows] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'custom_tables' AND column_name = 'entry_mode';
    `);

    if (rows.length > 0) {
      console.log('⏭️  entry_mode column already exists — nothing to do.');
      process.exit(0);
    }

    await sequelize.query(`
      ALTER TABLE custom_tables
      ADD COLUMN entry_mode VARCHAR(10) NOT NULL DEFAULT 'inline';
    `);

    console.log("✅ Added entry_mode column (default: 'inline') to custom_tables");
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
};

run();
