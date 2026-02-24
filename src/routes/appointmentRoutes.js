const express = require('express');
const controller = require('../controllers/appointmentController');

const router = express.Router();

router.get('/', controller.listAppointments);
router.post('/', controller.createAppointment);
router.put('/:id', controller.updateAppointment);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.deleteAppointment);

module.exports = router;
