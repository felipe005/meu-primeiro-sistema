const express = require('express');
const controller = require('../controllers/dashboardController');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(controller.getDashboard));

module.exports = router;
