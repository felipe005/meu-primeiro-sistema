const express = require('express');
const { getStats } = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), getStats);

module.exports = router;
