const express = require('express');
const { getStats, getAlerts } = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/alerts', authenticate, authorize('admin', 'funcionario'), getAlerts);
router.get('/', authenticate, authorize('admin'), getStats);

module.exports = router;
