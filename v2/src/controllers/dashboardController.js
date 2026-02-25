const { ok } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboardService');

async function getDashboard(req, res) {
  const data = await dashboardService.getDashboard(req.tenant.empresaId);
  ok(res, data);
}

module.exports = {
  getDashboard,
};
