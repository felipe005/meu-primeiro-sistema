const db = require('../utils/db');

async function metrics(req, res, next) {
  try {
    const companyId = req.auth.companyId;

    const [
      totalUsers,
      totalClients,
      totalServices,
      totalTeam,
      totalAppointments,
      pendingAppointments,
      inWashAppointments,
      readyAppointments,
      deliveredAppointments,
      todayRevenue,
    ] = await Promise.all([
      db.get('SELECT COUNT(*) AS total FROM users WHERE company_id = ?', [companyId]),
      db.get('SELECT COUNT(*) AS total FROM clients WHERE company_id = ?', [companyId]),
      db.get('SELECT COUNT(*) AS total FROM wash_services WHERE company_id = ?', [companyId]),
      db.get('SELECT COUNT(*) AS total FROM team_members WHERE company_id = ?', [companyId]),
      db.get('SELECT COUNT(*) AS total FROM appointments WHERE company_id = ?', [companyId]),
      db.get("SELECT COUNT(*) AS total FROM appointments WHERE company_id = ? AND status = 'aguardando'", [companyId]),
      db.get("SELECT COUNT(*) AS total FROM appointments WHERE company_id = ? AND status = 'em_lavagem'", [companyId]),
      db.get("SELECT COUNT(*) AS total FROM appointments WHERE company_id = ? AND status = 'pronto'", [companyId]),
      db.get("SELECT COUNT(*) AS total FROM appointments WHERE company_id = ? AND status = 'entregue'", [companyId]),
      db.get(
        "SELECT COALESCE(SUM(price), 0) AS total FROM appointments WHERE company_id = ? AND appointment_date = date('now', 'localtime')",
        [companyId]
      ),
    ]);

    res.json({
      companyName: req.auth.companyName,
      businessType: req.auth.businessType,
      planStatus: req.auth.planStatus,
      monthlyFee: req.auth.monthlyFee,
      nextBillingDate: req.auth.nextBillingDate,
      totalUsers: totalUsers.total,
      totalClients: totalClients.total,
      totalServices: totalServices.total,
      totalTeam: totalTeam.total,
      totalAppointments: totalAppointments.total,
      pendingAppointments: pendingAppointments.total,
      inWashAppointments: inWashAppointments.total,
      readyAppointments: readyAppointments.total,
      deliveredAppointments: deliveredAppointments.total,
      todayRevenue: todayRevenue.total,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  metrics,
};
