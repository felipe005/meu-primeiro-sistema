const dashboardModel = require('../models/dashboardModel');

async function getDashboard(empresaId) {
  const [metrics, chart] = await Promise.all([
    dashboardModel.getMetrics(empresaId),
    dashboardModel.getDailyChart(empresaId),
  ]);

  return {
    ...metrics,
    grafico: chart,
  };
}

module.exports = {
  getDashboard,
};
