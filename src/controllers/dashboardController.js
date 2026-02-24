const db = require('../utils/db');

async function metrics(req, res, next) {
  try {
    const companyId = req.auth.companyId;

    const [totalUsers, totalClients, activeClients, inactiveClients] = await Promise.all([
      db.get('SELECT COUNT(*) AS total FROM users WHERE company_id = ?', [companyId]),
      db.get('SELECT COUNT(*) AS total FROM clients WHERE company_id = ?', [companyId]),
      db.get("SELECT COUNT(*) AS total FROM clients WHERE company_id = ? AND status = 'active'", [companyId]),
      db.get("SELECT COUNT(*) AS total FROM clients WHERE company_id = ? AND status = 'inactive'", [companyId]),
    ]);

    res.json({
      companyName: req.auth.companyName,
      businessType: req.auth.businessType,
      planStatus: req.auth.planStatus,
      monthlyFee: req.auth.monthlyFee,
      nextBillingDate: req.auth.nextBillingDate,
      totalUsers: totalUsers.total,
      totalClients: totalClients.total,
      activeClients: activeClients.total,
      inactiveClients: inactiveClients.total,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  metrics,
};
