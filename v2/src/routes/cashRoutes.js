const express = require('express');
const controller = require('../controllers/cashController');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.get('/relatorio/mensal', asyncHandler(controller.monthlyReport));
router.get('/', asyncHandler(controller.list));
router.post('/', asyncHandler(controller.create));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
