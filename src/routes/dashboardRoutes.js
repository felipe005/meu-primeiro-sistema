const express = require('express');
const controller = require('../controllers/dashboardController');

const router = express.Router();

router.get('/metrics', controller.metrics);

module.exports = router;
