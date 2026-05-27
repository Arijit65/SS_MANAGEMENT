/**
 * Migration Runner Script
 */

const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const env = require('../config/env');

const RESET_MODE = process.argv.includes('--reset');

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'postgres',
  logging: (msg) => console.log(msg),
});

const runMigrations = async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    RUNNING MIGRATIONS');
  if (RESET_MODE) console.log('                    (RESET MODE)');
  console.log('═══════════════════════════════════════════════════════════');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Create migration tracking table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "_migrations" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL UNIQUE,
        "executed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Clear history if reset mode
    if (RESET_MODE) {
      await sequelize.query('DELETE FROM "_migrations"');
      console.log('🗑️  Cleared migration history\n');
    }
    
    // Get executed migrations
    const [executed] = await sequelize.query('SELECT name FROM "_migrations" ORDER BY id');
    const executedNames = executed.map(r => r.name);
    console.log(`📋 Executed: ${executedNames.length}`);
    
    // Get migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js')).sort();
    console.log(`📁 Found: ${files.length} files\n`);
    
    let ran = 0;
    for (const file of files) {
      if (executedNames.includes(file)) {
        console.log(`⏭️  Skip: ${file}`);
        continue;
      }
      
      console.log(`\n🔄 Running: ${file}`);
      console.log('─'.repeat(50));
      
      const migration = require(path.join(migrationsDir, file));
      await migration.up(sequelize.getQueryInterface(), Sequelize);
      
      await sequelize.query(`INSERT INTO "_migrations" (name) VALUES ($1)`, { bind: [file] });
      console.log(`✅ Done: ${file}`);
      ran++;
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`✅ Executed: ${ran}, Skipped: ${files.length - ran}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

runMigrations();
