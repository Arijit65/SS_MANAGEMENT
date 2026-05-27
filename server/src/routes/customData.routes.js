const { Router } = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
  bulkRemove,
} = require('../controllers/customData.controller');
const { requireAuth, checkTableAccess } = require('../middlewares/auth.middleware');

const router = Router();

router.use(requireAuth);

// Dynamic data CRUD routes with permission checks
router.get('/:tableName', checkTableAccess('canView'), getAll);
router.get('/:tableName/:id', checkTableAccess('canView'), getById);
router.post('/:tableName', checkTableAccess('canCreate'), create);
router.put('/:tableName/:id', checkTableAccess('canEdit'), update);
router.delete('/:tableName/bulk', checkTableAccess('canDelete'), bulkRemove);
router.delete('/:tableName/:id', checkTableAccess('canDelete'), remove);

module.exports = router;
