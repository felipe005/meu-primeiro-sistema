const express = require('express');
const controller = require('../controllers/serviceController');

const router = express.Router();

router.get('/', controller.listServices);
router.post('/', controller.createService);
router.put('/:id', controller.updateService);
router.delete('/:id', controller.deleteService);

module.exports = router;
