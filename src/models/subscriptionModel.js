const db = require('../utils/db');

function create({
  companyId,
  planStatus = 'active',
  monthlyFee = 49.99,
  pixKey = null,
  preferredPaymentMethod = 'pix',
  nextBillingDate,
}) {
  return db.run(
    `INSERT INTO subscriptions (company_id, plan_status, monthly_fee, pix_key, preferred_payment_method, next_billing_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [companyId, planStatus, monthlyFee, pixKey, preferredPaymentMethod, nextBillingDate || null]
  );
}

function findByCompany(companyId) {
  return db.get(
    `SELECT id, company_id AS companyId, plan_status AS planStatus, monthly_fee AS monthlyFee, pix_key AS pixKey,
            preferred_payment_method AS preferredPaymentMethod,
            next_billing_date AS nextBillingDate, updated_at AS updatedAt
     FROM subscriptions
     WHERE company_id = ?`,
    [companyId]
  );
}

function updateByCompany(companyId, { planStatus, monthlyFee, pixKey, preferredPaymentMethod, nextBillingDate }) {
  return db.run(
    `UPDATE subscriptions
     SET plan_status = ?, monthly_fee = ?, pix_key = ?, preferred_payment_method = ?, next_billing_date = ?, updated_at = CURRENT_TIMESTAMP
     WHERE company_id = ?`,
    [planStatus, monthlyFee, pixKey || null, preferredPaymentMethod || 'pix', nextBillingDate || null, companyId]
  );
}

function listPayments(companyId) {
  return db.all(
    `SELECT id, amount, due_date AS dueDate, paid_at AS paidAt, method, reference, status, created_at AS createdAt
     FROM subscription_payments
     WHERE company_id = ?
     ORDER BY created_at DESC`,
    [companyId]
  );
}

function createPayment(companyId, { amount, dueDate, paidAt, method = 'pix', reference, status = 'pending' }) {
  return db.run(
    `INSERT INTO subscription_payments (company_id, amount, due_date, paid_at, method, reference, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [companyId, amount, dueDate || null, paidAt || null, method, reference || null, status]
  );
}

function markPaymentPaid(companyId, paymentId) {
  return db.run(
    `UPDATE subscription_payments
     SET status = 'paid', paid_at = datetime('now', 'localtime')
     WHERE company_id = ? AND id = ?`,
    [companyId, paymentId]
  );
}

function setPlanStatusByCompany(companyId, planStatus) {
  return db.run(
    `UPDATE subscriptions
     SET plan_status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE company_id = ?`,
    [planStatus, companyId]
  );
}

function activateAndSetNextBilling(companyId, nextBillingDate) {
  return db.run(
    `UPDATE subscriptions
     SET plan_status = 'active', next_billing_date = ?, updated_at = CURRENT_TIMESTAMP
     WHERE company_id = ?`,
    [nextBillingDate || null, companyId]
  );
}

module.exports = {
  create,
  findByCompany,
  updateByCompany,
  listPayments,
  createPayment,
  markPaymentPaid,
  setPlanStatusByCompany,
  activateAndSetNextBilling,
};
