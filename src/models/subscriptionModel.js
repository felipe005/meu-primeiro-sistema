const db = require('../utils/db');

function create({ companyId, planStatus = 'active', monthlyFee = 99.9, nextBillingDate }) {
  return db.run(
    `INSERT INTO subscriptions (company_id, plan_status, monthly_fee, next_billing_date)
     VALUES (?, ?, ?, ?)`,
    [companyId, planStatus, monthlyFee, nextBillingDate || null]
  );
}

function findByCompany(companyId) {
  return db.get(
    `SELECT id, company_id AS companyId, plan_status AS planStatus, monthly_fee AS monthlyFee,
            next_billing_date AS nextBillingDate, updated_at AS updatedAt
     FROM subscriptions
     WHERE company_id = ?`,
    [companyId]
  );
}

function updateByCompany(companyId, { planStatus, monthlyFee, nextBillingDate }) {
  return db.run(
    `UPDATE subscriptions
     SET plan_status = ?, monthly_fee = ?, next_billing_date = ?, updated_at = CURRENT_TIMESTAMP
     WHERE company_id = ?`,
    [planStatus, monthlyFee, nextBillingDate || null, companyId]
  );
}

module.exports = {
  create,
  findByCompany,
  updateByCompany,
};
