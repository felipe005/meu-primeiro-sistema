const express = require('express');
const { create, list } = require('../controllers/productionController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.get('/', list);
router.post('/', authorize('admin', 'funcionario'), create);

module.exports = router;
