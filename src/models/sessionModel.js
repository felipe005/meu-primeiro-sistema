const db = require('../utils/db');

function create({ token, userId, expiresAt }) {
  return db.run(
    'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
    [token, userId, expiresAt]
  );
}

function findWithContext(token) {
  return db.get(
    `SELECT s.token,
            s.expires_at AS expiresAt,
            u.id AS userId,
            u.company_id AS companyId,
            u.name,
            u.email,
            u.role,
            u.platform_owner AS platformOwner,
            u.active,
            c.name AS companyName,
            c.business_type AS businessType,
            sub.plan_status AS planStatus,
            sub.monthly_fee AS monthlyFee,
            sub.next_billing_date AS nextBillingDate
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     JOIN companies c ON c.id = u.company_id
     LEFT JOIN subscriptions sub ON sub.company_id = c.id
     WHERE s.token = ?`,
    [token]
  );
}

function deleteByToken(token) {
  return db.run('DELETE FROM sessions WHERE token = ?', [token]);
}

function clearExpired() {
  return db.run('DELETE FROM sessions WHERE datetime(expires_at) <= datetime(CURRENT_TIMESTAMP)');
}

module.exports = {
  create,
  findWithContext,
  deleteByToken,
  clearExpired,
};
