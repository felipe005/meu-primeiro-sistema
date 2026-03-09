const express = require('express');
const { create, list, getById, saveSizes } = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.get('/', list);
router.get('/:id', getById);
router.post('/', authorize('admin'), create);
router.post('/:id/sizes', authorize('admin'), saveSizes);

module.exports = router;
