const express = require('express');
const controller = require('../controllers/platformController');

const router = express.Router();

router.get('/overview', controller.overview);
router.get('/companies', controller.listCompanies);
router.patch('/companies/:companyId/subscription', controller.updateCompanySubscription);

module.exports = router;
