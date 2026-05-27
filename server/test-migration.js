require('dotenv').config();
const { sequelize } = require('./src/models');

async function testMigration() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Check if access_level column exists
    const [columns] = await sequelize.query(
      `SELECT column_name, data_type, column_default 
       FROM information_schema.columns 
       WHERE table_name = 'user_table_permissions' 
       ORDER BY ordinal_position`
    );
    
    console.log('\n📋 user_table_permissions columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.column_default ? ` (default: ${col.column_default})` : ''}`);
    });

    // Check if table_access_rules exists
    const [tables] = await sequelize.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = 'table_access_rules'`
    );
    
    if (tables.length > 0) {
      console.log('\n✅ table_access_rules table exists');
      
      const [ruleColumns] = await sequelize.query(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'table_access_rules' 
         ORDER BY ordinal_position`
      );
      
      console.log('\n📋 table_access_rules columns:');
      ruleColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // Check indexes
      const [indexes] = await sequelize.query(
        `SELECT indexname FROM pg_indexes 
         WHERE tablename = 'table_access_rules'`
      );
      
      console.log('\n📋 table_access_rules indexes:');
      indexes.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });
    } else {
      console.log('\n❌ table_access_rules table does NOT exist');
    }

    await sequelize.close();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testMigration();
