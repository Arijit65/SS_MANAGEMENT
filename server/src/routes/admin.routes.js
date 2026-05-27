const { Router } = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');
const adminController = require('../controllers/admin.controller');

const router = Router();

// All routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// Get available roles and tables for user creation form
router.get('/roles', adminController.getRoles);
router.get('/tables', adminController.getAvailableTables);

// Get table fields for access rule configuration
router.get('/table-fields', adminController.getTableFields);

// User management CRUD
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);

// Access rule management
router.get('/users/:userId/permissions/:permissionId/rules', adminController.getAccessRules);
router.post('/users/:userId/permissions/:permissionId/rules', adminController.createAccessRule);
router.put('/users/:userId/permissions/:permissionId/rules/:ruleId', adminController.updateAccessRule);
router.delete('/users/:userId/permissions/:permissionId/rules/:ruleId', adminController.deleteAccessRule);
router.patch('/users/:userId/permissions/:permissionId/access-level', adminController.updatePermissionAccessLevel);

module.exports = router;
