const express = require('express');
const controller = require('../controllers/subscriptionController');
const { requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', controller.getSubscription);
router.put('/', requireAdmin, controller.updateSubscription);
router.get('/payments', requireAdmin, controller.listPayments);
router.post('/payments', requireAdmin, controller.createPayment);
router.patch('/payments/:id/pay', requireAdmin, controller.markPaymentPaid);

module.exports = router;
