const { asyncHandler } = require('../utils/asyncHandler');
const { getDashboardStats, getOperationalAlerts } = require('../models/dashboardModel');

const getStats = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats(req.user.id);
  return res.json(stats);
});

const getAlerts = asyncHandler(async (_req, res) => {
  const alerts = await getOperationalAlerts();
  return res.json(alerts);
});

module.exports = { getStats, getAlerts };
