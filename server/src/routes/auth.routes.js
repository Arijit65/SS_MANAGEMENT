const { Router } = require('express');
const { login, getProfile } = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = Router();

// No public register - users are created by admin only
router.post('/login', login);
router.get('/profile', requireAuth, getProfile);

module.exports = router;
