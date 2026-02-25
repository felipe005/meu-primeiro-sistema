const { ok } = require('../utils/apiResponse');
const subscriptionService = require('../services/subscriptionService');

async function getSubscription(req, res) {
  const data = await subscriptionService.get(req.tenant.empresaId);
  ok(res, data);
}

async function updateSubscription(req, res) {
  const data = await subscriptionService.update(req.tenant.empresaId, req.body);
  ok(res, data);
}

async function paymentConfig(req, res) {
  ok(res, subscriptionService.paymentIntegrationInfo());
}

module.exports = {
  getSubscription,
  updateSubscription,
  paymentConfig,
};
