const { Router } = require('express');

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const customTableRoutes = require('./customTable.routes');
const customDataRoutes = require('./customData.routes');
const projectRoutes = require('./project.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/custom-tables', customTableRoutes);
router.use('/custom-data', customDataRoutes);
router.use('/projects', projectRoutes);

module.exports = router;
