const express = require('express');
const controller = require('../controllers/subscriptionController');

const router = express.Router();

router.get('/', controller.getSubscription);
router.put('/', controller.updateSubscription);

module.exports = router;
