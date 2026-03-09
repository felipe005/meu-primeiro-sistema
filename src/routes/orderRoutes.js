const express = require('express');
const { create, list, getById, saveSizes, archive, unarchive, remove } = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.get('/', list);
router.get('/:id', getById);
router.post('/', authorize('admin'), create);
router.post('/:id/sizes', authorize('admin'), saveSizes);
router.patch('/:id/archive', authorize('admin'), archive);
router.patch('/:id/unarchive', authorize('admin'), unarchive);
router.delete('/:id', authorize('admin'), remove);

module.exports = router;
