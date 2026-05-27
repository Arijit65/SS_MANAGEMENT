const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync models (creates tables if they don't exist, but doesn't alter existing)
    await sequelize.sync({ alter: false });
    console.log('✅ Database models synchronized.');

    app.listen(env.PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${env.PORT}`);
      console.log('');
      console.log('📋 Available scripts:');
      console.log('   npm run migrate       - Run database migrations');
      console.log('   npm run create-admin  - Create admin credentials');
      console.log('   npm run setup         - Run both migrations and create admin');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

startServer();
