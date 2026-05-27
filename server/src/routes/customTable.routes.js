const { Router } = require('express');
const {
  getAll,
  getById,
  getByName,
  create,
  update,
  archive,
  restore,
  remove,
  getFields,
  addField,
  updateField,
  removeField,
  reorderFields,
  getRelationOptions,
  getTableRelations,
  getTablesForRelation,
} = require('../controllers/customTable.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = Router();

router.use(requireAuth);

// Relation routes (must come before :id routes to avoid conflicts)
router.get('/available-for-relation', getTablesForRelation);

// Table management routes
router.get('/', getAll);
router.get('/by-name/:name', getByName);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/archive', archive);
router.post('/:id/restore', restore);
router.delete('/:id', remove);

// Relation routes for specific table
router.get('/:tableId/relations', getTableRelations);

// Field management routes
router.get('/:tableId/fields', getFields);
router.post('/:tableId/fields', addField);
router.put('/:tableId/fields/reorder', reorderFields);
router.put('/:tableId/fields/:fieldId', updateField);
router.delete('/:tableId/fields/:fieldId', removeField);

// Relation field options
router.get('/:tableId/fields/:fieldId/relation-options', getRelationOptions);

module.exports = router;
