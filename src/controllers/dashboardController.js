const { asyncHandler } = require('../utils/asyncHandler');
const { getDashboardStats } = require('../models/dashboardModel');

const getStats = asyncHandler(async (_req, res) => {
  const stats = await getDashboardStats();
  return res.json(stats);
});

module.exports = { getStats };
