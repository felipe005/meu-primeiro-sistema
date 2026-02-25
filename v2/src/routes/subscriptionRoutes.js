const express = require('express');
const controller = require('../controllers/subscriptionController');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(controller.getSubscription));
router.put('/', asyncHandler(controller.updateSubscription));
router.get('/payment-config', asyncHandler(controller.paymentConfig));

module.exports = router;
