const express = require('express');
const { create, list } = require('../controllers/productionController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { uploadEvidence } = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.use(authenticate);
router.get('/', list);
router.post('/', authorize('admin', 'funcionario'), uploadEvidence.single('foto'), create);

module.exports = router;
