const { Sequelize } = require('sequelize');

// Helper function to map Sequelize types to custom field types
const mapTypeToCustomField = (sequelizeType) => {
  const typeStr = sequelizeType.toString().toLowerCase();
  
  if (typeStr.includes('string') || typeStr.includes('char')) return 'text';
  if (typeStr.includes('text')) return 'textarea';
  if (typeStr.includes('integer') || typeStr.includes('decimal') || typeStr.includes('numeric')) return 'number';
  if (typeStr.includes('date') && !typeStr.includes('dateonly')) return 'date';
  if (typeStr.includes('dateonly')) return 'date';
  if (typeStr.includes('boolean')) return 'checkbox';
  return 'text'; // default
};

// Table configurations with field definitions
const TABLE_CONFIGS = {
  onboarding_cdr: {
    display_name: 'Onboarding',
    description: 'Client onboarding and billing information',
    icon: 'UserPlus',
    fields: [
      { name: 'sale_date', label: 'Sale Date', type: 'date', is_searchable: false, show_in_list: true },
      { name: 'sales_executive', label: 'Sales Executive', type: 'text', is_searchable: true, show_in_list: true },
      { name: 'billing_name', label: 'Billing Name', type: 'text', is_searchable: true, show_in_list: true },
      { name: 'phone_number', label: 'Phone Number', type: 'phone', is_searchable: true, show_in_list: true },
      { name: 'location', label: 'Location', type: 'textarea', is_searchable: true, show_in_list: false },
      { name: 'package_type', label: 'Package Type', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'add_ons', label: 'Add-ons', type: 'textarea', is_searchable: false, show_in_list: false },
      { name: 'total_amount', label: 'Total Amount', type: 'number', is_searchable: false, show_in_list: true },
      { name: 'paid_amount', label: 'Paid Amount', type: 'number', is_searchable: false, show_in_list: true },
      { name: 'invoice_link', label: 'Invoice Link', type: 'url', is_searchable: false, show_in_list: false },
      { name: 'onboarding_status', label: 'Onboarding Status', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'service_plan_status', label: 'Service Plan Status', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'access_status', label: 'Access Status', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'customer_type', label: 'Customer Type', type: 'text', is_searchable: false, show_in_list: true },
    ],
  },
  smodb_cdr: {
    display_name: 'SMO',
    description: 'Social Media Optimization database',
    icon: 'Share2',
    fields: [
      { name: 'coordinator_cls', label: 'Coordinator CLS', type: 'text', is_searchable: true, show_in_list: true },
      { name: 'page_name', label: 'Page Name', type: 'text', is_searchable: true, show_in_list: true },
      { name: 'client_input', label: 'Client Input', type: 'textarea', is_searchable: false, show_in_list: false },
      { name: 'library', label: 'Library', type: 'text', is_searchable: false, show_in_list: false },
      { name: 'library_file_upload', label: 'Library File Upload', type: 'url', is_searchable: false, show_in_list: false },
      { name: 'photoshoot_images', label: 'Photoshoot Images', type: 'url', is_searchable: false, show_in_list: false },
      { name: 'photoshoot_videos', label: 'Photoshoot Videos', type: 'url', is_searchable: false, show_in_list: false },
      { name: 'graphics_designer_ca', label: 'Graphics Designer CA', type: 'text', is_searchable: false, show_in_list: false },
      { name: 'posting_qc', label: 'Posting QC', type: 'text', is_searchable: false, show_in_list: false },
      { name: 'content_qc', label: 'Content QC', type: 'text', is_searchable: false, show_in_list: false },
      { name: 'posting_dms', label: 'Posting DMS', type: 'text', is_searchable: false, show_in_list: false },
      { name: 'marketer_dms', label: 'Marketer DMS', type: 'text', is_searchable: false, show_in_list: false },
      { name: 'technical_dms', label: 'Technical DMS', type: 'text', is_searchable: false, show_in_list: false },
      { name: 'content_dms', label: 'Content DMS', type: 'text', is_searchable: false, show_in_list: false },
      { name: 'design_qc', label: 'Design QC', type: 'text', is_searchable: false, show_in_list: false },
      { name: 'sm_analyst', label: 'SM Analyst', type: 'text', is_searchable: false, show_in_list: false },
      { name: 'facebook', label: 'Facebook', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'instagram', label: 'Instagram', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'youtube', label: 'YouTube', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'gmb', label: 'GMB', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'vendor_name', label: 'Vendor Name', type: 'text', is_searchable: true, show_in_list: true },
      { name: 'contact_person_name', label: 'Contact Person Name', type: 'text', is_searchable: true, show_in_list: true },
      { name: 'contact_person_phone_number', label: 'Contact Person Phone', type: 'phone', is_searchable: true, show_in_list: true },
      { name: 'package', label: 'Package', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'language', label: 'Language', type: 'text', is_searchable: false, show_in_list: false },
      { name: 'phone_number', label: 'Phone Number', type: 'phone', is_searchable: true, show_in_list: true },
      { name: 'email', label: 'Email', type: 'email', is_searchable: true, show_in_list: true },
      { name: 'address', label: 'Address', type: 'textarea', is_searchable: false, show_in_list: false },
      { name: 'website', label: 'Website', type: 'url', is_searchable: false, show_in_list: false },
      { name: 'logo', label: 'Logo', type: 'url', is_searchable: false, show_in_list: false },
      { name: 'business_description', label: 'Business Description', type: 'textarea', is_searchable: false, show_in_list: false },
      { name: 'products_or_services_offered', label: 'Products/Services Offered', type: 'textarea', is_searchable: false, show_in_list: false },
      { name: 'focus_product_or_service', label: 'Focus Product/Service', type: 'textarea', is_searchable: false, show_in_list: false },
      { name: 'offers_or_discounts', label: 'Offers/Discounts', type: 'textarea', is_searchable: false, show_in_list: false },
      { name: 'gmb_addon', label: 'GMB Addon', type: 'text', is_searchable: false, show_in_list: false },
      { name: 'status', label: 'Status', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'subscription_date', label: 'Subscription Date', type: 'date', is_searchable: false, show_in_list: true },
    ],
  },
  websitedb: {
    display_name: 'Website',
    description: 'Website development projects database',
    icon: 'Globe',
    fields: [
      { name: 'coordinator_cls', label: 'Coordinator CLS', type: 'text', is_searchable: true, show_in_list: true },
      { name: 'client_name', label: 'Client Name', type: 'text', is_searchable: true, show_in_list: true },
      { name: 'contact_person_name', label: 'Contact Person Name', type: 'text', is_searchable: true, show_in_list: true },
      { name: 'contact_person_phone_number', label: 'Contact Person Phone', type: 'phone', is_searchable: true, show_in_list: true },
      { name: 'frontend_developer', label: 'Frontend Developer', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'backend_developer', label: 'Backend Developer', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'quality_control', label: 'Quality Control', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'content', label: 'Content', type: 'textarea', is_searchable: false, show_in_list: false },
      { name: 'website_type', label: 'Website Type', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'features_required', label: 'Features Required', type: 'textarea', is_searchable: false, show_in_list: false },
      { name: 'client_type', label: 'Client Type', type: 'text', is_searchable: false, show_in_list: true },
      { name: 'client_services_or_products', label: 'Client Services/Products', type: 'textarea', is_searchable: false, show_in_list: false },
      { name: 'logo', label: 'Logo', type: 'url', is_searchable: false, show_in_list: false },
      { name: 'other_images', label: 'Other Images', type: 'url', is_searchable: false, show_in_list: false },
      { name: 'display_phone_number', label: 'Display Phone Number', type: 'phone', is_searchable: false, show_in_list: false },
      { name: 'display_address', label: 'Display Address', type: 'textarea', is_searchable: false, show_in_list: false },
      { name: 'display_email_id', label: 'Display Email', type: 'email', is_searchable: false, show_in_list: false },
      { name: 'client_requests', label: 'Client Requests', type: 'textarea', is_searchable: false, show_in_list: false },
    ],
  },
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Starting migration: Converting static tables to custom tables...');

      // Process each static table
      for (const [tableName, config] of Object.entries(TABLE_CONFIGS)) {
        console.log(`\nProcessing table: ${tableName}`);

        // Step 1: Create custom table entry
        const [customTable] = await queryInterface.sequelize.query(
          `
          INSERT INTO custom_tables (name, display_name, description, icon, is_active, is_archived, created_at, updated_at)
          VALUES (:name, :display_name, :description, :icon, true, false, NOW(), NOW())
          RETURNING id;
          `,
          {
            replacements: {
              name: tableName,
              display_name: config.display_name,
              description: config.description,
              icon: config.icon,
            },
            transaction,
          }
        );

        const customTableId = customTable[0].id;
        console.log(`  ✓ Created custom_table entry with ID: ${customTableId}`);

        // Step 2: Create custom fields
        for (let i = 0; i < config.fields.length; i++) {
          const field = config.fields[i];
          await queryInterface.sequelize.query(
            `
            INSERT INTO custom_fields (
              table_id, name, label, type, is_required, is_searchable, 
              show_in_list, field_order, created_at, updated_at
            )
            VALUES (
              :table_id, :name, :label, :type, false, :is_searchable, 
              :show_in_list, :field_order, NOW(), NOW()
            );
            `,
            {
              replacements: {
                table_id: customTableId,
                name: field.name,
                label: field.label,
                type: field.type,
                is_searchable: field.is_searchable,
                show_in_list: field.show_in_list,
                field_order: i + 1,
              },
              transaction,
            }
          );
        }
        console.log(`  ✓ Created ${config.fields.length} custom field definitions`);

        // Step 3: Migrate existing data
        const [existingData] = await queryInterface.sequelize.query(
          `SELECT * FROM ${tableName};`,
          { transaction }
        );

        console.log(`  ✓ Found ${existingData.length} records to migrate`);

        for (const record of existingData) {
          // Build JSONB data object (exclude id, created_at, updated_at)
          const data = {};
          for (const field of config.fields) {
            if (record[field.name] !== undefined && record[field.name] !== null) {
              data[field.name] = record[field.name];
            }
          }

          await queryInterface.sequelize.query(
            `
            INSERT INTO custom_table_data (table_id, data, created_at, updated_at)
            VALUES (:table_id, :data, :created_at, :updated_at);
            `,
            {
              replacements: {
                table_id: customTableId,
                data: JSON.stringify(data),
                created_at: record.created_at || new Date(),
                updated_at: record.updated_at || new Date(),
              },
              transaction,
            }
          );
        }
        console.log(`  ✓ Migrated ${existingData.length} records to custom_table_data`);

        // Step 4: Update user permissions from 'system' to 'custom'
        const [updatedPermissions] = await queryInterface.sequelize.query(
          `
          UPDATE user_table_permissions 
          SET "tableType" = 'custom'
          WHERE "tableType" = 'system' AND "tableName" = :tableName
          RETURNING *;
          `,
          {
            replacements: { tableName },
            transaction,
          }
        );
        console.log(`  ✓ Updated ${updatedPermissions.length} user permissions`);

        console.log(`✅ Successfully migrated ${tableName} to custom table system`);
      }

      await transaction.commit();
      console.log('\n✅ Migration completed successfully!');
      console.log('\n⚠️  IMPORTANT: You can now safely:');
      console.log('   1. Remove the static table model files');
      console.log('   2. Drop the old static tables if no longer needed');
      console.log('   3. Update application code to use custom table system');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Rolling back migration: Restoring static tables...');

      for (const [tableName, config] of Object.entries(TABLE_CONFIGS)) {
        console.log(`\nReverting table: ${tableName}`);

        // Get custom table ID
        const [customTable] = await queryInterface.sequelize.query(
          `SELECT id FROM custom_tables WHERE name = :tableName;`,
          {
            replacements: { tableName },
            transaction,
          }
        );

        if (customTable.length === 0) {
          console.log(`  ⚠️  Custom table ${tableName} not found, skipping...`);
          continue;
        }

        const customTableId = customTable[0].id;

        // Restore data from custom_table_data back to static table
        const [customData] = await queryInterface.sequelize.query(
          `SELECT * FROM custom_table_data WHERE table_id = :table_id;`,
          {
            replacements: { table_id: customTableId },
            transaction,
          }
        );

        console.log(`  ✓ Found ${customData.length} records to restore`);

        // Restore each record back to the original static table
        for (const record of customData) {
          const data = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;

          // Build field list and values
          const fields = Object.keys(data);
          const values = Object.values(data);
          
          const fieldList = fields.join(', ');
          const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

          // Note: This assumes the static tables still exist
          await queryInterface.sequelize.query(
            `INSERT INTO ${tableName} (${fieldList}, created_at, updated_at)
             VALUES (${placeholders}, $${fields.length + 1}, $${fields.length + 2});`,
            {
              bind: [...values, record.created_at, record.updated_at],
              transaction,
            }
          );
        }

        console.log(`  ✓ Restored ${customData.length} records to ${tableName}`);

        // Revert permissions back to 'system'
        await queryInterface.sequelize.query(
          `UPDATE user_table_permissions 
           SET "tableType" = 'system'
           WHERE "tableType" = 'custom' AND "tableName" = :tableName;`,
          {
            replacements: { tableName },
            transaction,
          }
        );

        // Delete custom table data
        await queryInterface.sequelize.query(
          `DELETE FROM custom_table_data WHERE table_id = :table_id;`,
          {
            replacements: { table_id: customTableId },
            transaction,
          }
        );

        // Delete custom fields
        await queryInterface.sequelize.query(
          `DELETE FROM custom_fields WHERE table_id = :table_id;`,
          {
            replacements: { table_id: customTableId },
            transaction,
          }
        );

        // Delete custom table
        await queryInterface.sequelize.query(
          `DELETE FROM custom_tables WHERE id = :id;`,
          {
            replacements: { id: customTableId },
            transaction,
          }
        );

        console.log(`✅ Successfully reverted ${tableName}`);
      }

      await transaction.commit();
      console.log('\n✅ Rollback completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  },
};
