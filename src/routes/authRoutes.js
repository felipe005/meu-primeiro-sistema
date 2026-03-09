const express = require('express');
const { login, me } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, me);

module.exports = router;
